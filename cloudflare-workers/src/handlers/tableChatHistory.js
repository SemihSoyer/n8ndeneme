// Tablo chat history handler'ları

// Chat geçmişini getir
export async function getTableChatHistory(tableId, env) {
  try {
    const messages = await env.DB.prepare(`
      SELECT 
        id,
        role,
        message,
        created_at
      FROM table_chat_messages
      WHERE table_id = ?
      ORDER BY created_at ASC
      LIMIT 32
    `).bind(tableId).all();

    return jsonResponse({
      table_id: tableId,
      messages: messages.results || [],
    });

  } catch (error) {
    console.error('Chat history error:', error);
    return jsonResponse({ 
      error: 'Chat geçmişi alınırken hata oluştu',
      message: error.message 
    }, 500);
  }
}

// Chat mesajı kaydet
export async function saveTableChatMessage(request, env) {
  try {
    const payload = await request.json();
    const { table_id: tableId, role, message, web_search_results: webSearchResults } = payload;

    if (!tableId) {
      return jsonResponse({ error: 'table_id zorunludur' }, 400);
    }

    if (!role || !['user', 'assistant'].includes(role)) {
      return jsonResponse({ error: 'role "user" veya "assistant" olmalıdır' }, 400);
    }

    if (!message || typeof message !== 'string') {
      return jsonResponse({ error: 'message zorunludur' }, 400);
    }

    const messageId = crypto.randomUUID();
    
    await env.DB.prepare(`
      INSERT INTO table_chat_messages (
        id, table_id, role, message, web_search_results
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      messageId,
      tableId,
      role,
      message.slice(0, 2000), // Max 2000 karakter
      webSearchResults ? JSON.stringify(webSearchResults).slice(0, 4000) : null
    ).run();

    return jsonResponse({
      success: true,
      message_id: messageId,
    });

  } catch (error) {
    console.error('Save chat message error:', error);
    return jsonResponse({ 
      error: 'Mesaj kaydedilirken hata oluştu',
      message: error.message 
    }, 500);
  }
}

// Chat geçmişini temizle
export async function clearTableChatHistory(tableId, env) {
  try {
    await env.DB.prepare(`
      DELETE FROM table_chat_messages WHERE table_id = ?
    `).bind(tableId).run();

    return jsonResponse({
      success: true,
      message: 'Chat geçmişi temizlendi',
    });

  } catch (error) {
    console.error('Clear chat history error:', error);
    return jsonResponse({ 
      error: 'Chat geçmişi temizlenirken hata oluştu',
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

