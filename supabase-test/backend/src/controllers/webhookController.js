import { supabase } from '../utils/supabaseClient.js';

export async function handleWebhook(req, res, next) {
  try {
    const {
      table_id: tableId,
      document_id: documentId,
      chat_message_id: chatMessageId,
      status,
      table_data: tableData,
      error_message: errorMessage,
      api_secret: incomingSecret,
    } = req.body ?? {};

    if (!tableId) {
      return res.status(400).json({ error: 'table_id zorunludur' });
    }

    const expectedSecret = process.env.API_SECRET;
    if (expectedSecret && incomingSecret && incomingSecret !== expectedSecret) {
      return res.status(403).json({ error: 'Geçersiz api_secret' });
    }

    if (status === 'completed') {
      const { error: updateError } = await supabase
        .from('generated_tables')
        .update({
          status: 'completed',
          table_data: tableData,
          completed_at: new Date().toISOString(),
        })
        .eq('id', tableId);

      if (updateError) throw updateError;

      await overwriteAssistantMessage(documentId, 'Tablo oluşturuldu! ✅', tableData);
    } else if (status === 'failed') {
      const { error: failError } = await supabase
        .from('generated_tables')
        .update({
          status: 'failed',
          error_message: errorMessage ?? 'Bilinmeyen hata',
          completed_at: new Date().toISOString(),
        })
        .eq('id', tableId);

      if (failError) throw failError;

      await overwriteAssistantMessage(
        documentId,
        `Tablo oluşturulurken hata oluştu: ${errorMessage ?? 'bilinmiyor'}`
      );
    } else {
      console.warn(`Desteklenmeyen durum: ${status}`);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

async function overwriteAssistantMessage(documentId, message, tableData) {
  if (!documentId) return;

  const preview = tableData ? formatPreview(tableData) : '';

  const { data: assistantMessages, error } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('document_id', documentId)
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Assistant mesajı okunamadı:', error);
    return;
  }

  const latest = assistantMessages?.[0];
  if (!latest) return;

  const { error: updateError } = await supabase
    .from('chat_messages')
    .update({ message: `${message}\n\n${preview}`.trim() })
    .eq('id', latest.id);

  if (updateError) {
    console.error('Assistant mesajı güncellenemedi:', updateError);
  }
}

function formatPreview(tableData) {
  const columns = tableData?.columns ?? tableData?.headers ?? [];
  const rows = tableData?.rows ?? [];

  if (!columns.length || !rows.length) {
    return 'Tablo verisi bulunamadı.';
  }

  const header = columns.join(' | ');
  const separator = columns.map(() => '---').join(' | ');

  const formattedRows = rows
    .slice(0, 5)
    .map((row) => {
      if (Array.isArray(row)) {
        return row
          .map((cell) => (cell === undefined || cell === null ? '-' : String(cell)))
          .join(' | ');
      }
      return columns
        .map((col) => {
          const cell = row[col];
          return cell === undefined || cell === null ? '-' : String(cell);
        })
        .join(' | ');
    })
    .join('\n');

  const extra = rows.length > 5 ? `\n... ve ${rows.length - 5} satır daha` : '';

  return ['```', header, separator, formattedRows, extra, '```'].filter(Boolean).join('\n');
}
