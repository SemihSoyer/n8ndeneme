import { handleUpload } from './handlers/upload.js';
import { handleChat, handleGetMessages } from './handlers/chat.js';
import { handleWebhook } from './handlers/webhook.js';
import { handleStatus } from './handlers/status.js';
import { handleDownload } from './handlers/download.js';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === '/' || path === '/health') {
        return jsonResponse({ 
          status: 'ok', 
          message: 'Document Analysis API çalışıyor!',
          timestamp: new Date().toISOString()
        });
      }

      // API routes
      if (path === '/api/upload' && request.method === 'POST') {
        return handleUpload(request, env);
      }

      // Document download endpoint (N8N için)
      if (path.match(/^\/api\/documents\/[^\/]+\/download$/) && request.method === 'GET') {
        const documentId = path.split('/')[3]; // /api/documents/{id}/download
        return handleDownload(request, env, documentId);
      }

      // Document bilgisi endpoint
      if (path.startsWith('/api/documents/') && request.method === 'GET') {
        const documentId = path.split('/').pop();
        return handleGetDocument(documentId, env);
      }

      if (path === '/api/chat' && request.method === 'POST') {
        return handleChat(request, env);
      }

      if (path.startsWith('/api/chat/') && request.method === 'GET') {
        const documentId = path.split('/').pop();
        return handleGetMessages(documentId, env);
      }

      if (path === '/api/webhook/n8n' && request.method === 'POST') {
        return handleWebhook(request, env);
      }

      if (path.startsWith('/api/status/') && request.method === 'GET') {
        const tableId = path.split('/').pop();
        return handleStatus(tableId, env);
      }

      // 404
      return jsonResponse({ error: 'Endpoint bulunamadı' }, 404);

    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({ 
        error: 'Sunucu hatası',
        message: error.message 
      }, 500);
    }
  }
};

// Helper: Get document info
async function handleGetDocument(documentId, env) {
  const result = await env.DB.prepare(
    'SELECT * FROM documents WHERE id = ?'
  ).bind(documentId).first();

  if (!result) {
    return jsonResponse({ error: 'Belge bulunamadı' }, 404);
  }

  return jsonResponse(result);
}

// Helper: JSON response with CORS
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

