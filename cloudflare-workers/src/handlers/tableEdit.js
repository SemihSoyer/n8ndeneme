// Tablo düzenleme handler'ı
export async function handleTableEdit(request, env) {
  try {
    const payload = await request.json();
    const { table_id: tableId, table_data: tableData, prompt } = payload;

    // Validasyon
    if (!tableId) {
      return jsonResponse({ error: 'table_id zorunludur' }, 400);
    }

    if (!tableData) {
      return jsonResponse({ error: 'table_data zorunludur' }, 400);
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return jsonResponse({ error: 'prompt zorunludur ve boş olamaz' }, 400);
    }

    if (prompt.length > 500) {
      return jsonResponse({ error: 'prompt maksimum 500 karakter olabilir' }, 400);
    }

    // Tablo verisini validate et
    if (!tableData.columns || !Array.isArray(tableData.columns)) {
      return jsonResponse({ error: 'table_data.columns array olmalıdır' }, 400);
    }

    if (!tableData.rows || !Array.isArray(tableData.rows)) {
      return jsonResponse({ error: 'table_data.rows array olmalıdır' }, 400);
    }

    if (tableData.columns.length > 50) {
      return jsonResponse({ error: 'Maksimum 50 sütun desteklenir' }, 400);
    }

    if (tableData.rows.length > 1000) {
      return jsonResponse({ error: 'Maksimum 1000 satır desteklenir' }, 400);
    }

    // table_id'nin gerçekten var olduğunu kontrol et
    const existingTable = await env.DB.prepare(`
      SELECT id, document_id FROM generated_tables WHERE id = ?
    `).bind(tableId).first();

    if (!existingTable) {
      return jsonResponse({ error: 'Tablo bulunamadı' }, 404);
    }

    // document_id'yi existingTable'dan al (eğer request'te yoksa)
    const finalDocumentId = payload.document_id || existingTable.document_id;

    // table_edits kaydı oluştur
    const editId = crypto.randomUUID();
    const tableDataStr = JSON.stringify(tableData);

    await env.DB.prepare(`
      INSERT INTO table_edits (
        id, table_id, document_id, original_table_data, prompt, status
      ) VALUES (?, ?, ?, ?, ?, 'processing')
    `).bind(
      editId,
      tableId,
      finalDocumentId,
      tableDataStr,
      prompt.trim()
    ).run();

    // N8N webhook URL'ini al
    const n8nWebhookUrl = env.N8N_TABLE_EDIT_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      console.error('N8N_TABLE_EDIT_WEBHOOK_URL environment variable tanımlı değil');
      
      // Hata durumunda kaydı güncelle
      await env.DB.prepare(`
        UPDATE table_edits 
        SET status = 'failed',
            error_message = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        'N8N webhook URL yapılandırılmamış',
        editId
      ).run();

      return jsonResponse({ error: 'N8N webhook URL yapılandırılmamış' }, 500);
    }

    // N8N'e asenkron istek gönder
    const callbackUrl = `${new URL(request.url).origin}/api/webhook/n8n`;
    const n8nPayload = {
      table_data: tableData,
      prompt: prompt.trim(),
      edit_id: editId,
      table_id: tableId,
      callback_url: callbackUrl,
      api_secret: env.API_SECRET,
    };

    console.log('N8N Table Edit Payload:', JSON.stringify(n8nPayload, null, 2));

    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload),
      });

      const n8nResponseBody = await n8nResponse.text();
      console.log('N8N response status:', n8nResponse.status);
      console.log('N8N response body:', n8nResponseBody);

      if (!n8nResponse.ok) {
        throw new Error(`N8N webhook hatası: ${n8nResponse.status}`);
      }
    } catch (err) {
      console.error('N8N webhook error:', err.toString());

      // Hata durumunda kaydı güncelle
      await env.DB.prepare(`
        UPDATE table_edits 
        SET status = 'failed',
            error_message = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        `N8N webhook hatası: ${err.message}`,
        editId
      ).run();

      return jsonResponse({ 
        error: 'N8N webhook hatası',
        message: err.message 
      }, 500);
    }

    // 202 Accepted - Asenkron işlem başlatıldı
    return jsonResponse({
      success: true,
      edit_id: editId,
      table_id: tableId,
      status: 'processing',
      message: 'Tablo düzenleme işlemi başlatıldı',
    }, 202);

  } catch (error) {
    console.error('Table edit error:', error);
    return jsonResponse({ 
      error: 'Tablo düzenleme hatası',
      message: error.message 
    }, 500);
  }
}

// Tablo düzenleme durumunu kontrol et
export async function handleTableEditStatus(editId, env) {
  try {
    console.log('📊 Table edit status sorgulanıyor:', editId);
    
    const result = await env.DB.prepare(`
      SELECT 
        id,
        table_id,
        status,
        edited_table_data,
        error_message,
        created_at,
        completed_at
      FROM table_edits
      WHERE id = ?
    `).bind(editId).first();

    if (!result) {
      console.log('❌ Düzenleme kaydı bulunamadı:', editId);
      return jsonResponse({ error: 'Düzenleme kaydı bulunamadı' }, 404);
    }

    console.log('✅ Table edit kaydı bulundu:', { 
      editId: result.id, 
      status: result.status,
      has_edited_data: !!result.edited_table_data 
    });

    // edited_table_data JSON parse et
    let editedTableData = null;
    if (result.edited_table_data) {
      try {
        editedTableData = JSON.parse(result.edited_table_data);
        console.log('✅ edited_table_data parse edildi');
      } catch (e) {
        console.error('❌ JSON parse error:', e);
      }
    }

    const response = {
      edit_id: result.id,
      table_id: result.table_id,
      status: result.status,
      edited_table_data: editedTableData,
      error_message: result.error_message,
      created_at: result.created_at,
      completed_at: result.completed_at,
    };
    
    console.log('📤 Status response:', JSON.stringify(response, null, 2));
    
    return jsonResponse(response);

  } catch (error) {
    console.error('Table edit status error:', error);
    return jsonResponse({ 
      error: 'Düzenleme durumu sorgulanırken hata oluştu',
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

