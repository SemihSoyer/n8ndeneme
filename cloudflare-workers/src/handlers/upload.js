// Dosya yükleme handler'ı
export async function handleUpload(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return jsonResponse({ error: 'Dosya bulunamadı' }, 400);
    }

    // Dosya boyutu kontrolü
    const maxSize = parseInt(env.MAX_FILE_SIZE || '10485760'); // 10MB
    if (file.size > maxSize) {
      return jsonResponse({ 
        error: 'Dosya çok büyük', 
        maxSize: `${maxSize / 1024 / 1024}MB` 
      }, 400);
    }

    // Dosya tipi kontrolü
    const allowedTypes = (env.ALLOWED_FILE_TYPES || '').split(',');
    if (!allowedTypes.includes(file.type)) {
      return jsonResponse({ 
        error: 'Desteklenmeyen dosya tipi',
        allowedTypes 
      }, 400);
    }

    // Benzersiz ID oluştur
    const documentId = crypto.randomUUID();
    const filename = file.name;
    const r2Key = `documents/${documentId}/${filename}`;

    // R2'ye dosyayı kaydet
    await env.R2_BUCKET.put(r2Key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // D1'e metadata kaydet
    await env.DB.prepare(`
      INSERT INTO documents (id, filename, file_type, r2_key, file_size, status)
      VALUES (?, ?, ?, ?, ?, 'uploaded')
    `).bind(
      documentId,
      filename,
      file.type,
      r2Key,
      file.size
    ).run();

    return jsonResponse({
      success: true,
      document: {
        id: documentId,
        filename,
        fileType: file.type,
        fileSize: file.size,
        r2Key,
        uploadedAt: new Date().toISOString()
      }
    }, 201);

  } catch (error) {
    console.error('Upload error:', error);
    return jsonResponse({ 
      error: 'Dosya yüklenirken hata oluştu',
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

