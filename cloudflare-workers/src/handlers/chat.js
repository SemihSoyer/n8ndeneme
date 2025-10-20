// Chat mesajları handler'ı
export async function handleChat(request, env, ctx) {
  try {
    const { documentId, message } = await request.json();

    if (!documentId || !message) {
      return jsonResponse({ error: 'documentId ve message gerekli' }, 400);
    }

    // Belgenin var olup olmadığını kontrol et
    const document = await env.DB.prepare(
      'SELECT * FROM documents WHERE id = ?'
    ).bind(documentId).first();

    if (!document) {
      return jsonResponse({ error: 'Belge bulunamadı' }, 404);
    }

    // Kullanıcı mesajını kaydet
    const chatMessageId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO chat_messages (id, document_id, role, message)
      VALUES (?, ?, 'user', ?)
    `).bind(chatMessageId, documentId, message).run();

    // Generated table kaydı oluştur (processing durumunda)
    const tableId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO generated_tables (id, document_id, chat_message_id, status)
      VALUES (?, ?, ?, 'processing')
    `).bind(tableId, documentId, chatMessageId).run();

    // Güvenli download URL'i oluştur (N8N için)
    const workerUrl = new URL(request.url).origin;
    const downloadUrl = `${workerUrl}/api/documents/${documentId}/download`;

    // N8N'e webhook isteği gönder
    const n8nPayload = {
      document_id: documentId,
      chat_message_id: chatMessageId,
      table_id: tableId,
      download_url: downloadUrl,
      api_secret: env.API_SECRET, // N8N'in dosyayı indirmesi için
      user_request: message,
      callback_url: `${workerUrl}/api/webhook/n8n`,
      document_info: {
        filename: document.filename,
        file_type: document.file_type,
        file_size: document.file_size
      }
    };

    // N8N'e asenkron istek gönder (fire and forget)
    if (env.N8N_WEBHOOK_URL) {
      console.log('Sending to N8N:', env.N8N_WEBHOOK_URL);
      console.log('Payload:', JSON.stringify(n8nPayload, null, 2));
      
      try {
        const response = await fetch(env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n8nPayload)
        });
        const responseBody = await response.text();
        console.log('N8N response status:', response.status);
        console.log('N8N response body:', responseBody);
      } catch (err) {
        console.error('N8N webhook error:', err.toString());
      }

    } else {
      console.error('N8N_WEBHOOK_URL is not defined!');
    }

    // Assistant mesajı ekle (processing)
    const assistantMessageId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO chat_messages (id, document_id, role, message)
      VALUES (?, ?, 'assistant', ?)
    `).bind(
      assistantMessageId, 
      documentId, 
      'Tablo oluşturuluyor, lütfen bekleyin...'
    ).run();

    return jsonResponse({
      success: true,
      chatMessageId,
      tableId,
      assistantMessageId,
      status: 'processing',
      message: 'İstek N8N\'e gönderildi'
    }, 201);

  } catch (error) {
    console.error('Chat error:', error);
    return jsonResponse({ 
      error: 'Mesaj gönderilirken hata oluştu',
      message: error.message 
    }, 500);
  }
}

// Chat mesajlarını getir
export async function handleGetMessages(documentId, env) {
  try {
    const messages = await env.DB.prepare(`
      SELECT * FROM chat_messages 
      WHERE document_id = ? 
      ORDER BY created_at ASC
    `).bind(documentId).all();

    return jsonResponse({
      documentId,
      messages: messages.results || []
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return jsonResponse({ 
      error: 'Mesajlar alınırken hata oluştu',
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

