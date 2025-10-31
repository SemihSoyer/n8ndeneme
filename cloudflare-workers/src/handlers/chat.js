// Chat mesajları handler'ı
export async function handleChat(request, env, ctx) {
  try {
    // Gelen veri güncellendi: documentId -> documentIds ve template eklendi
    const requestBody = await request.json();
    console.log('Backend received request body:', JSON.stringify(requestBody, null, 2));
    
    const { documentIds, message, template = 'genel-analiz' } = requestBody;
    console.log('Extracted template:', template);

    // Kontrol güncellendi: documentIds'nin bir dizi olduğunu kontrol et
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0 || !message) {
      return jsonResponse({ error: 'documentIds (dizi) ve message gerekli' }, 400);
    }
    
    // Template validation
    const validTemplates = ['fatura', 'fis-dekont', 'tablo', 'sozlesme', 'genel-analiz'];
    const selectedTemplate = validTemplates.includes(template) ? template : 'genel-analiz';
    console.log('Selected template after validation:', selectedTemplate);
    
    // NOT: Bu örnekte, her belgenin var olup olmadığını kontrol etmiyoruz
    // Production'da bu kontrol eklenebilir.

    // Kullanıcı mesajını sadece ilk belgeye bağlıyoruz (şimdilik)
    const primaryDocumentId = documentIds[0];
    const chatMessageId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO chat_messages (id, document_id, role, message)
      VALUES (?, ?, 'user', ?)
    `).bind(chatMessageId, primaryDocumentId, message).run();

    // Toplu işlem için tek bir `tableId` oluşturuyoruz
    const tableId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO generated_tables (id, document_id, chat_message_id, status)
      VALUES (?, ?, ?, 'processing')
    `).bind(tableId, primaryDocumentId, chatMessageId).run();


    // N8N'e gönderilecek payload güncellendi
    const n8nPayload = {
      table_id: tableId, // N8N'den geri gelecek olan işlem ID'si
      document_ids: documentIds,
      user_request: message,
      template: selectedTemplate, // Template bilgisini ekle
      callback_url: `${new URL(request.url).origin}/api/webhook/n8n`,
      api_secret: env.API_SECRET,
    };
    
    console.log('N8N Payload with template:', JSON.stringify(n8nPayload, null, 2));

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

    // Asistan mesajı ekle (processing)
    const assistantMessageId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO chat_messages (id, document_id, role, message)
      VALUES (?, ?, 'assistant', ?)
    `).bind(
      assistantMessageId, 
      primaryDocumentId, 
      `${documentIds.length} belge için tablo oluşturuluyor...`
    ).run();

    return jsonResponse({
      success: true,
      tableId: tableId, // Frontend'in durumu takip etmesi için
      assistantMessageId,
      status: 'processing',
      message: `${documentIds.length} belge N8N'e gönderildi`
    }, 202);

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

