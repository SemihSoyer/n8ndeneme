// N8N webhook handler'ı
export async function handleWebhook(request, env) {
  try {
    const payload = await request.json();
    
    const { 
      table_id, 
      document_id,
      chat_message_id,
      status, 
      table_data, 
      error_message 
    } = payload;

    if (!table_id) {
      return jsonResponse({ error: 'table_id gerekli' }, 400);
    }

    // Generated table kaydını güncelle
    if (status === 'completed') {
      await env.DB.prepare(`
        UPDATE generated_tables 
        SET status = 'completed',
            table_data = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        JSON.stringify(table_data),
        table_id
      ).run();

      // Assistant mesajını güncelle (tablo sonucu)
      const tablePreview = generateTablePreview(table_data);
      await env.DB.prepare(`
        UPDATE chat_messages 
        SET message = ?
        WHERE document_id = ? AND role = 'assistant'
        ORDER BY created_at DESC
        LIMIT 1
      `).bind(
        `Tablo oluşturuldu!\n\n${tablePreview}`,
        document_id
      ).run();

    } else if (status === 'failed') {
      await env.DB.prepare(`
        UPDATE generated_tables 
        SET status = 'failed',
            error_message = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        error_message || 'Bilinmeyen hata',
        table_id
      ).run();

      // Hata mesajı ekle
      await env.DB.prepare(`
        UPDATE chat_messages 
        SET message = ?
        WHERE document_id = ? AND role = 'assistant'
        ORDER BY created_at DESC
        LIMIT 1
      `).bind(
        `Tablo oluşturulurken hata oluştu: ${error_message}`,
        document_id
      ).run();
    }

    return jsonResponse({
      success: true,
      message: 'Webhook işlendi',
      tableId: table_id,
      status
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return jsonResponse({ 
      error: 'Webhook işlenirken hata oluştu',
      message: error.message 
    }, 500);
  }
}

// Tablo önizlemesi oluştur (basit text formatı)
function generateTablePreview(tableData) {
  if (!tableData || !tableData.rows || tableData.rows.length === 0) {
    return 'Tablo verisi bulunamadı.';
  }

  const headers = tableData.headers || Object.keys(tableData.rows[0]);
  const rows = tableData.rows.slice(0, 5); // İlk 5 satır

  let preview = '```\n';
  preview += headers.join(' | ') + '\n';
  preview += headers.map(() => '---').join(' | ') + '\n';
  
  rows.forEach(row => {
    const values = headers.map(h => row[h] || '');
    preview += values.join(' | ') + '\n';
  });

  if (tableData.rows.length > 5) {
    preview += `... ve ${tableData.rows.length - 5} satır daha\n`;
  }

  preview += '```';

  return preview;
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

