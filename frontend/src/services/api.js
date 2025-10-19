import { API_URL } from '../config';

// Dosya yükleme
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Dosya yüklenemedi');
  }

  return response.json();
}

// Chat mesajı gönder
export async function sendChatMessage(documentId, message) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ documentId, message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Mesaj gönderilemedi');
  }

  return response.json();
}

// Chat mesajlarını getir
export async function getChatMessages(documentId) {
  const response = await fetch(`${API_URL}/api/chat/${documentId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Mesajlar alınamadı');
  }

  return response.json();
}

// Tablo durumunu kontrol et
export async function getTableStatus(tableId) {
  const response = await fetch(`${API_URL}/api/status/${tableId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Durum alınamadı');
  }

  return response.json();
}

// Belge bilgisi getir
export async function getDocument(documentId) {
  const response = await fetch(`${API_URL}/api/documents/${documentId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Belge bilgisi alınamadı');
  }

  return response.json();
}

