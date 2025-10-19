// İşlem durumu sorgulama handler'ı
export async function handleStatus(tableId, env) {
  try {
    const result = await env.DB.prepare(`
      SELECT 
        gt.*,
        d.filename,
        d.file_type
      FROM generated_tables gt
      LEFT JOIN documents d ON gt.document_id = d.id
      WHERE gt.id = ?
    `).bind(tableId).first();

    if (!result) {
      return jsonResponse({ error: 'İşlem bulunamadı' }, 404);
    }

    // table_data JSON parse et
    let tableData = null;
    if (result.table_data) {
      try {
        tableData = JSON.parse(result.table_data);
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }

    return jsonResponse({
      tableId: result.id,
      documentId: result.document_id,
      status: result.status,
      createdAt: result.created_at,
      completedAt: result.completed_at,
      errorMessage: result.error_message,
      tableData,
      documentInfo: {
        filename: result.filename,
        fileType: result.file_type
      }
    });

  } catch (error) {
    console.error('Status error:', error);
    return jsonResponse({ 
      error: 'Durum sorgulanırken hata oluştu',
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

