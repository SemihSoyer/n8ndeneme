import { supabase } from '../utils/supabaseClient.js';

export async function getDocument(req, res, next) {
  try {
    const { documentId } = req.params;
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Belge bulunamadı' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function downloadDocument(req, res, next) {
  try {
    const { documentId } = req.params;
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.API_SECRET;

    if (!expectedSecret) {
      return res.status(500).json({ error: 'API_SECRET tanımlanmalı' });
    }

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return res.status(401).json({ error: 'Yetkilendirme gerekiyor' });
    }

    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!document) {
      return res.status(404).json({ error: 'Belge bulunamadı' });
    }

    const bucket = process.env.SUPABASE_BUCKET || 'documents';
    const { data: signedUrl, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(document.storage_path, 60);

    if (signedError) {
      throw signedError;
    }

    res.json({
      downloadUrl: signedUrl.signedUrl,
      expiresInSeconds: 60,
      filename: document.filename,
      fileType: document.file_type,
    });
  } catch (error) {
    next(error);
  }
}
