// Export job handler'ları

/**
 * POST /api/export/create
 * Export job oluşturur ve n8n workflow'u tetikler
 */
export async function handleExportCreate(request, env) {
  try {
    const { table_id, format } = await request.json();

    // Validation
    if (!table_id) {
      return jsonResponse({ error: 'table_id gerekli' }, 400);
    }

    if (!format || !['excel', 'pdf'].includes(format)) {
      return jsonResponse({ error: 'format "excel" veya "pdf" olmalı' }, 400);
    }

    // Table'ın var olduğunu kontrol et
    const table = await env.DB.prepare(
      'SELECT id, table_data FROM generated_tables WHERE id = ?'
    ).bind(table_id).first();

    if (!table) {
      return jsonResponse({ error: 'Tablo bulunamadı' }, 404);
    }

    if (!table.table_data) {
      return jsonResponse({ error: 'Tablo verisi boş' }, 400);
    }

    // Export job oluştur (Web Crypto API ile UUID)
    const jobId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO export_jobs (id, table_id, format, status, created_at)
      VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `).bind(jobId, table_id, format).run();

    // n8n workflow'u tetikle (webhook)
    const n8nWebhookUrl = env.N8N_EXPORT_WEBHOOK_URL || 'http://localhost:5678/webhook/export-document';
    
    try {
      // n8n'e async request gönder
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          table_id: table_id,
          format: format,
          table_data: JSON.parse(table.table_data),
          callback_url: `${new URL(request.url).origin}/api/export/callback`
        })
      });
    } catch (error) {
      console.error('n8n webhook error:', error);
      // n8n hatası varsa job'u failed yap
      await env.DB.prepare(
        'UPDATE export_jobs SET status = ?, error_message = ? WHERE id = ?'
      ).bind('failed', 'n8n workflow tetiklenemedi', jobId).run();
      
      return jsonResponse({ 
        error: 'Export işlemi başlatılamadı',
        message: error.message 
      }, 500);
    }

    return jsonResponse({
      success: true,
      job_id: jobId,
      status: 'pending',
      message: 'Export işlemi başlatıldı. Lütfen durumu kontrol edin.'
    }, 201);

  } catch (error) {
    console.error('Export create error:', error);
    return jsonResponse({ 
      error: 'Export job oluşturulamadı',
      message: error.message 
    }, 500);
  }
}

/**
 * GET /api/export/status/:jobId
 * Export job durumunu sorgular
 */
export async function handleExportStatus(jobId, env) {
  try {
    const job = await env.DB.prepare(
      'SELECT * FROM export_jobs WHERE id = ?'
    ).bind(jobId).first();

    if (!job) {
      return jsonResponse({ error: 'Export job bulunamadı' }, 404);
    }

    return jsonResponse({
      job_id: job.id,
      table_id: job.table_id,
      format: job.format,
      status: job.status,
      file_url: job.file_url,
      file_size: job.file_size,
      created_at: job.created_at,
      completed_at: job.completed_at,
      error_message: job.error_message
    });

  } catch (error) {
    console.error('Export status error:', error);
    return jsonResponse({ 
      error: 'Durum sorgulanamadı',
      message: error.message 
    }, 500);
  }
}

/**
 * POST /api/export/callback
 * n8n workflow'dan gelen callback (export tamamlandı)
 */
export async function handleExportCallback(request, env) {
  try {
    const { job_id, status, r2_key, file_size, error_message } = await request.json();

    if (!job_id) {
      return jsonResponse({ error: 'job_id gerekli' }, 400);
    }

    // Job'ı güncelle
    if (status === 'completed') {
      // R2 public URL oluştur
      const file_url = `${env.R2_PUBLIC_URL}/${r2_key}`;

      await env.DB.prepare(`
        UPDATE export_jobs 
        SET status = 'completed',
            r2_key = ?,
            file_url = ?,
            file_size = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(r2_key, file_url, file_size, job_id).run();

    } else if (status === 'failed') {
      await env.DB.prepare(`
        UPDATE export_jobs 
        SET status = 'failed',
            error_message = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(error_message || 'Bilinmeyen hata', job_id).run();
    }

    return jsonResponse({
      success: true,
      message: 'Callback işlendi',
      job_id,
      status
    });

  } catch (error) {
    console.error('Export callback error:', error);
    return jsonResponse({ 
      error: 'Callback işlenemedi',
      message: error.message 
    }, 500);
  }
}

// Helper function
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
