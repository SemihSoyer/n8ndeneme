import { supabase } from '../utils/supabaseClient.js';

export async function getTableStatus(req, res, next) {
  try {
    const { tableId } = req.params;

    const { data, error } = await supabase
      .from('generated_tables')
      .select(`
        id,
        status,
        error_message,
        created_at,
        completed_at,
        table_data,
        document_id,
        documents:document_id (
          filename,
          file_type
        )
      `)
      .eq('id', tableId)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'İşlem bulunamadı' });
    }

    res.json({
      tableId: data.id,
      documentId: data.document_id,
      status: data.status,
      errorMessage: data.error_message,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      tableData: data.table_data,
      documentInfo: data.documents
        ? {
            filename: data.documents.filename,
            fileType: data.documents.file_type,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
}
