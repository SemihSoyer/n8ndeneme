import { API_URL } from '../config';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787';

// Hata yönetimi ve yanıtları standartlaştırmak için yardımcı fonksiyon
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Bilinmeyen sunucu hatası' }));
    throw new Error(error.error || 'İstek başarısız oldu');
  }
  return response.json();
}

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
export async function sendChatMessage(documentIds, message, template = 'genel-analiz') {
  // Gelenin dizi olup olmadığını kontrol et, değilse diziye çevir
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds];
  
  const payload = { documentIds: ids, message, template };
  console.log('API payload being sent:', payload);
  
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
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

// Tablo düzenleme - AI ile
export async function editTableWithAI(tableId, tableData, prompt) {
  const payload = {
    table_id: tableId,
    table_data: tableData,
    prompt: prompt.trim(),
  };

  const response = await fetch(`${API_URL}/api/table/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

// Tablo düzenleme durumunu kontrol et
export async function getTableEditStatus(editId) {
  const response = await fetch(`${API_URL}/api/table/edit/status/${editId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Düzenleme durumu alınamadı');
  }

  return response.json();
}

