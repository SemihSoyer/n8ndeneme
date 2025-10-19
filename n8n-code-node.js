// N8N Code Node - Basit Versiyon

// Webhook'tan gelen verileri al
const webhookData = $('Webhook').first().json;

// OpenAI'dan gelen yanıtı al
const openaiOutput = $input.first().json;

// Cloudflare'a göndereceğimiz data
const result = {
  table_id: webhookData.table_id,
  status: 'completed',
  table_data: typeof openaiOutput === 'string' ? openaiOutput : JSON.stringify(openaiOutput),
  error_message: null
};

// Debug için log
console.log('Webhook table_id:', webhookData.table_id);
console.log('Webhook callback_url:', webhookData.callback_url);
console.log('Result:', result);

return result;

