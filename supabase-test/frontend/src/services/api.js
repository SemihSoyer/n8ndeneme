const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

async function parseResponse(response) {
  if (!response.ok) {
    let message = 'Sunucu hatası';
    try {
      const data = await response.json();
      message = data?.error || data?.message || message;
    } catch (error) {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  return parseResponse(response);
}

export async function sendChatMessage(documentIds, message) {
  const payload = {
    documentIds: Array.isArray(documentIds) ? documentIds : [documentIds],
    message,
  };

  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function getChatMessages(documentId) {
  const response = await fetch(`${API_URL}/api/chat/${documentId}`);
  return parseResponse(response);
}

export async function getTableStatus(tableId) {
  const response = await fetch(`${API_URL}/api/status/${tableId}`);
  return parseResponse(response);
}

export async function getDocument(documentId) {
  const response = await fetch(`${API_URL}/api/documents/${documentId}`);
  return parseResponse(response);
}
