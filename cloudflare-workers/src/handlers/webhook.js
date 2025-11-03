// N8N webhook handler'ı
export async function handleWebhook(request, env) {
  try {
    const payload = await request.json();
    
    const { 
      edit_id: editId,
      table_id, 
      document_id,
      chat_message_id,
      status, 
      table_data,
      edited_table_data: editedTableData,
      total_documents,
      processed_documents,
      error_message 
    } = payload;

    // edit_id varsa table_edits kaydını güncelle (tablo düzenleme işlemi)
    if (editId) {
      console.log('🔧 Tablo düzenleme webhook alındı:', { editId, table_id, status, editedTableData });
      
      if (!table_id) {
        return jsonResponse({ error: 'table_id zorunludur (edit_id ile birlikte)' }, 400);
      }

      if (status === 'completed') {
        if (!editedTableData || editedTableData === 'null' || editedTableData === '') {
          return jsonResponse({ error: 'edited_table_data zorunludur (status=completed için)' }, 400);
        }

        // table_edits kaydını güncelle
        const editedTableDataStr = typeof editedTableData === 'string' 
          ? editedTableData 
          : JSON.stringify(editedTableData);

        console.log('📝 table_edits güncelleniyor:', editId);
        const updateEditResult = await env.DB.prepare(`
          UPDATE table_edits 
          SET status = 'completed',
              edited_table_data = ?,
              completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          editedTableDataStr,
          editId
        ).run();
        console.log('✅ table_edits güncellendi:', updateEditResult);

        // Orijinal tabloyu da güncelle (kullanıcı düzenlenmiş tabloyu görebilsin)
        console.log('📝 generated_tables güncelleniyor:', table_id);
        const updateTableResult = await env.DB.prepare(`
          UPDATE generated_tables 
          SET table_data = ?,
              completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          editedTableDataStr,
          table_id
        ).run();
        console.log('✅ generated_tables güncellendi:', updateTableResult);

        return jsonResponse({ success: true, edit_id: editId });
      } else if (status === 'failed') {
        // table_edits kaydını hata durumuyla güncelle
        await env.DB.prepare(`
          UPDATE table_edits 
          SET status = 'failed',
              error_message = ?,
              completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          error_message || 'Bilinmeyen hata',
          editId
        ).run();

        return jsonResponse({ success: true, edit_id: editId });
      } else {
        return jsonResponse({ error: `Desteklenmeyen durum: ${status}` }, 400);
      }
    }

    // Eski format: generated_tables için (belge analiz workflow'u)
    if (!table_id) {
      return jsonResponse({ error: 'table_id veya edit_id zorunludur' }, 400);
    }

    // Generated table kaydını güncelle
    if (status === 'completed') {
      // table_data'nın JSON string olduğundan emin ol
      const tableDataStr = typeof table_data === 'string' 
        ? table_data 
        : JSON.stringify(table_data);

      await env.DB.prepare(`
        UPDATE generated_tables 
        SET status = 'completed',
            table_data = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        tableDataStr,
        table_id
      ).run();

      // document_id varsa assistant mesajını güncelle (tablo sonucu)
      if (document_id) {
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
      }

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

      // document_id varsa hata mesajı ekle
      if (document_id) {
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
    }

    return jsonResponse({
      success: true,
      message: 'Webhook işlendi',
      tableId: table_id,
      status,
      documentsProcessed: total_documents || null,
      documentIds: processed_documents || null
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

  // N8N'den gelen format: { columns: [], rows: [[]] }
  const columns = tableData.columns || tableData.headers || [];
  const rows = tableData.rows || [];
  
  // Array formatında mı object formatında mı?
  const isArrayFormat = rows.length > 0 && Array.isArray(rows[0]);
  
  const previewRows = rows.slice(0, 5); // İlk 5 satır

  let preview = '```\n';
  preview += columns.join(' | ') + '\n';
  preview += columns.map(() => '---').join(' | ') + '\n';
  
  previewRows.forEach(row => {
    let values;
    if (isArrayFormat) {
      // Array formatı: her satır bir dizi
      values = columns.map((col, idx) => {
        const cell = row[idx];
        return cell !== undefined && cell !== null ? String(cell) : '-';
      });
    } else {
      // Object formatı: her satır bir obje
      values = columns.map(col => {
        const cell = row[col];
        return cell !== undefined && cell !== null ? String(cell) : '-';
      });
    }
    preview += values.join(' | ') + '\n';
  });

  if (rows.length > 5) {
    preview += `... ve ${rows.length - 5} satır daha\n`;
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
