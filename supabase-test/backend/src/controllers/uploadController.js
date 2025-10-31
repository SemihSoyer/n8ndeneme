import multer from 'multer';
import { randomUUID } from 'crypto';
import { supabase } from '../utils/supabaseClient.js';

const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage }).single('file');

export async function handleUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya bulunamadı' });
    }

    const bucket = process.env.SUPABASE_BUCKET || 'documents';
    const documentId = randomUUID();
    const fileExt = req.file.originalname.split('.').pop();
    const safeExtension = fileExt ? `.${fileExt}` : '';
    const objectPath = `documents/${documentId}${safeExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: documentRows, error: insertError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        filename: req.file.originalname,
        file_type: req.file.mimetype,
        storage_path: objectPath,
        file_size: req.file.size,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({
      success: true,
      document: {
        id: documentRows.id,
        filename: documentRows.filename,
        fileType: documentRows.file_type,
        fileSize: documentRows.file_size,
        storagePath: documentRows.storage_path,
      },
    });
  } catch (error) {
    next(error);
  }
}
