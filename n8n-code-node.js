// Önceki adımlardan gelen verileri alıyoruz.
const modelOutput = $input.item.json;
// DÜZELTME: Gelen webhook verisi bir 'body' nesnesi içinde yer alıyor.
const webhookData = $('Webhook').item.json.body;

// Modelin çıktısı bazen stringified JSON olarak gelebilir,
// bu yüzden önce kontrol edip parse ediyoruz.
let modelContent;
if (modelOutput.message && modelOutput.message.content) {
  modelContent = modelOutput.message.content;
  if (typeof modelContent === 'string') {
    try {
      modelContent = JSON.parse(modelContent);
    } catch (e) {
      throw new Error('Model çıktısı JSON formatında değil: ' + modelContent);
    }
  }
}

// Gerekli verilerin (columns ve rows) varlığını kontrol ediyoruz.
if (!modelContent || !modelContent.columns || !modelContent.rows) {
  throw new Error('Model çıktısı beklenen `columns` ve `rows` alanlarını içermiyor.');
}

// Satırları daha kullanışlı olan nesne dizisine dönüştürüyoruz.
const columns = modelContent.columns;
const rows = modelContent.rows.map(row => {
  const rowObject = {};
  columns.forEach((col, index) => {
    rowObject[col] = row[index];
  });
  return rowObject;
});

// Cloudflare Worker'ın beklediği formatta payload'u oluşturuyoruz.
const payload = {
  table_id: webhookData.table_id,
  document_id: webhookData.document_id,
  status: 'completed',
  table_data: {
    columns: columns,
    rows: rows
  }
};

// Bir sonraki "HTTP Request" düğümünde kullanmak üzere sonucu hazırlıyoruz.
return {
  json: {
    payload: payload
  }
};

