// Güvenli dosya indirme handler'ı (N8N için)
export async function handleDownload(request, env, documentId) {
  try {
    // Authorization kontrolü
    const authHeader = request.headers.get('Authorization');
    const apiSecret = env.API_SECRET;
    
    if (!apiSecret) {
      console.error('API_SECRET tanımlanmamış!');
      return jsonResponse({ error: 'Sunucu yapılandırma hatası' }, 500);
    }

    // Bearer token kontrolü
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Authorization header:', authHeader);
      return jsonResponse({ 
        error: 'Yetkilendirme gerekli',
        message: 'Authorization header eksik veya hatalı' 
      }, 401);
    }

    const token = authHeader.substring(7); // "Bearer " kısmını çıkar
    
    console.log('Received token:', token);
    console.log('Expected token:', apiSecret);
    console.log('Match:', token === apiSecret);
    
    if (token !== apiSecret) {
      return jsonResponse({ 
        error: 'Yetkisiz erişim',
        message: 'Geçersiz API token' 
      }, 403);
    }

    // Document bilgisini D1'den al
    const document = await env.DB.prepare(
      'SELECT * FROM documents WHERE id = ?'
    ).bind(documentId).first();

    if (!document) {
      return jsonResponse({ error: 'Belge bulunamadı' }, 404);
    }

    // R2'den dosyayı al
    const r2Object = await env.R2_BUCKET.get(document.r2_key);

    if (!r2Object) {
      return jsonResponse({ 
        error: 'Dosya R2\'de bulunamadı',
        r2Key: document.r2_key 
      }, 404);
    }

    // Dosyayı stream olarak döndür
    return new Response(r2Object.body, {
      status: 200,
      headers: {
        'Content-Type': document.file_type,
        'Content-Disposition': `attachment; filename="${document.filename}"`,
        'Content-Length': document.file_size.toString(),
        'Access-Control-Allow-Origin': '*',
        'X-Document-ID': documentId,
        'X-Filename': document.filename,
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return jsonResponse({ 
      error: 'Dosya indirilirken hata oluştu',
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

