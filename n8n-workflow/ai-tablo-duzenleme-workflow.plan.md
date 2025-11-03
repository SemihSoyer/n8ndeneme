# n8n Yapay Zeka Tablo Düzenleme Workflow Planı

## Genel Bakış

Mevcut OCR workflow'undan farklı olarak, bu yeni workflow mevcut tablo verisini alacak, kullanıcının prompt'una göre AI ile düzenleyecek ve sonucu frontend'e geri gönderecek.

## Mimari Yapı

```
Frontend (TableDisplay) 
  → Backend API (/api/table/edit) 
    → n8n Workflow (Yeni Webhook) 
      → AI Servis (OpenAI/Mistral/Claude)
        → Tablo Düzenleme & Validasyon
          → Webhook Callback
            → Frontend'e Güncellenmiş Tablo
```

## 1. Frontend Değişiklikleri

### 1.1 TableDisplay.jsx Güncellemeleri
- **Yeni State**: `isEditingWithAI`, `aiPrompt`, `isProcessingAI`
- **Yeni Fonksiyon**: `handleAIEdit(tableData, prompt)` - Mevcut tablo verisini ve prompt'u backend'e gönderir
- **UI Bileşeni**: "AI ile Düzenle" butonu ve prompt input modalı
- **Polling Mekanizması**: ChatInterface'deki gibi işlem durumunu takip eder

### 1.2 API Servisi Güncellemesi (services/api.js)
- **Yeni Fonksiyon**: `editTableWithAI(tableId, tableData, prompt)` - Backend'e düzenleme isteği gönderir
- **Yeni Fonksiyon**: `getTableEditStatus(editId)` - Düzenleme işleminin durumunu kontrol eder

## 2. Backend Değişiklikleri (Cloudflare Workers)

### 2.1 Yeni Handler: table-edit.js
**Endpoint**: `POST /api/table/edit`

**Request Body**:
```json
{
  "table_id": "uuid",           // Mevcut tablonun ID'si
  "table_data": {                // Güncel tablo verisi
    "columns": ["col1", "col2"],
    "rows": [{"col1": "val1", ...}]
  },
  "prompt": "100tl altındaki ürünleri çıkar",
  "document_id": "uuid"          // Opsiyonel: ilişkili belge
}
```

**İşlemler**:
1. Request validation
2. Veritabanına `table_edits` kaydı oluştur (status: 'processing')
3. n8n'e yeni workflow webhook'una istek gönder
4. 202 Accepted response döndür (async processing)

### 2.2 Veritabanı Şeması Güncellemesi
**Yeni Tablo**: `table_edits`
```sql
CREATE TABLE table_edits (
  id TEXT PRIMARY KEY,
  table_id TEXT NOT NULL,
  document_id TEXT,
  original_table_data TEXT NOT NULL,
  edited_table_data TEXT,
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  error_message TEXT,
  FOREIGN KEY (table_id) REFERENCES generated_tables(id)
);
```

### 2.3 Webhook Handler Güncellemesi
**Endpoint**: `POST /api/webhook/n8n` (mevcut)

Yeni webhook payload formatı:
```json
{
  "edit_id": "uuid",
  "table_id": "uuid",
  "status": "completed",
  "edited_table_data": {...},
  "error_message": "..."
}
```

### 2.4 Index.js Routing
- `/api/table/edit` endpoint'ini ekle

## 3. n8n Workflow Oluşturulması

### 3.1 Yeni Workflow: "AI Table Editor"

**Webhook Node**: `Webhook - Table Edit`
- HTTP Method: POST
- Path: `table-edit-ai`
- Body parametreleri:
  - `table_data`: Mevcut tablo verisi
  - `prompt`: Kullanıcının düzenleme isteği
  - `edit_id`: İşlem takip ID'si
  - `callback_url`: Geri dönüş URL'si

**Code Node**: `Validate Table Data`
- Tablo formatını doğrula
- JSON yapısını kontrol et
- Hata varsa early return

**AI Model Node**: `Edit Table with AI`
- **Servis**: OpenAI GPT-4 / Mistral / Claude
- **Prompt Template**:
```
Sen bir tablo düzenleme uzmanısın. Aşağıdaki tabloyu kullanıcının isteğine göre düzenle.

Mevcut Tablo:
{{ JSON.stringify(table_data) }}

Kullanıcı İsteği:
{{ prompt }}

Kurallar:
1. Tablonun yapısını (columns) koru, sadece satır ve veri içeriğini değiştir
2. Yeni satır ekleniyorsa, mevcut column yapısına uygun olmalı
3. Sadece JSON formatında düzenlenmiş tablo verisini döndür, açıklama ekleme
4. Format: { "columns": [...], "rows": [...] }

Düzenlenmiş Tablo:
```

**Code Node**: `Parse AI Response`
- AI'dan gelen response'u parse et
- JSON formatını doğrula
- Tablo yapısını kontrol et

**Code Node**: `Format Response`
- n8n callback formatına çevir
- `edit_id`, `table_id`, `status`, `edited_table_data` içeren payload oluştur

**HTTP Request Node**: `Callback to Backend`
- `callback_url`'e POST isteği gönder
- Düzenlenmiş tablo verisini gönder

## 4. Frontend-Backend-N8N İletişim Akışı

### 4.1 Düzenleme İsteği
1. Kullanıcı TableDisplay'de "AI ile Düzenle" butonuna tıklar
2. Modal açılır, prompt girer
3. Frontend `POST /api/table/edit` çağrısı yapar
4. Backend veritabanına kayıt oluşturur
5. n8n webhook'una istek gönderir
6. 202 Accepted döner (edit_id ile)

### 4.2 İşlem Takibi
1. Frontend polling başlatır: `GET /api/table/edit/status/:editId`
2. Backend veritabanından durumu kontrol eder
3. Status: 'processing' → polling devam eder
4. Status: 'completed' → düzenlenmiş tablo verisi döner
5. Status: 'failed' → hata mesajı gösterilir

### 4.3 N8N İşlemi
1. Webhook tetiklenir
2. Tablo validasyonu yapılır
3. AI'ya prompt gönderilir
4. AI'dan düzenlenmiş tablo alınır
5. Validasyon yapılır
6. Callback URL'ine POST isteği gönderilir
7. Backend veritabanını günceller
8. Frontend polling ile yeni veriyi alır

## 5. Hata Yönetimi

### 5.1 AI Response Hataları
- JSON parse hatası → Retry mekanizması (max 2 kez)
- Geçersiz tablo formatı → Hata mesajı döndür
- Timeout → Retry veya hata bildirimi

### 5.2 Frontend Hataları
- Network hatası → Retry button göster
- Geçersiz prompt → Client-side validation
- İşlem timeout → Kullanıcıya bilgi ver

## 6. Güvenlik ve Validasyon

- Prompt uzunluk limiti: 500 karakter
- Tablo boyut limiti: Max 1000 satır, 50 sütun
- Rate limiting: Kullanıcı başına dakikada max 10 istek
- Input sanitization: XSS koruması

## 7. Kullanıcı Deneyimi İyileştirmeleri

- Loading state: "AI tablonuzu düzenliyor..." mesajı
- Preview: Değişiklikler uygulanmadan önce önizleme (opsiyonel)
- Undo: Düzenlemeden önceki hali geri yükle
- Success feedback: "Tablo başarıyla düzenlendi" bildirimi

## 8. Test Senaryoları

1. **Basit Silme**: "100tl altındaki ürünleri çıkar"
2. **Satır Ekleme**: "Tablonun altına yeni satırlar ekle"
3. **Veri Değiştirme**: "Tarih formatını YYYY-MM-DD'ye çevir"
4. **Karmaşık İşlem**: "2024-2025 arası araba fiyatlarını ekle"
5. **Hata Durumları**: Geçersiz prompt, AI timeout, network hataları

## 9. Opsiyonel Özellikler (Gelecek)

- İşlem geçmişi: Kullanıcı önceki düzenlemeleri görebilir
- Batch editing: Birden fazla tabloyu aynı anda düzenleme
- Template-based editing: Önceden tanımlı düzenleme şablonları

