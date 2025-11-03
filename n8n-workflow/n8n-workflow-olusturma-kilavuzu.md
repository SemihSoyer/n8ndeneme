# n8n AI Tablo Düzenleme Workflow Oluşturma Kılavuzu

## Workflow'un Amacı

Bu workflow, frontend'den gelen mevcut tablo verisini ve kullanıcının düzenleme isteğini (prompt) alarak, yapay zeka yardımıyla tabloyu düzenler ve sonucu backend'e geri gönderir.

## Workflow Akışı

### 1. Webhook Node - Başlangıç Noktası
**Ne Yapar:**
- Backend'den gelen HTTP POST isteğini dinler
- İstekte şunlar gelir:
  - `table_data`: Düzenlenecek mevcut tablo verisi (JSON formatında)
  - `prompt`: Kullanıcının düzenleme isteği (örnek: "100tl altındaki ürünleri çıkar")
  - `edit_id`: İşlem takip ID'si
  - `table_id`: Orijinal tablonun ID'si
  - `callback_url`: İşlem tamamlandığında geri dönüş yapılacak URL

**Yapılacaklar:**
- Webhook path: `table-edit-ai`
- HTTP Method: POST
- Response Mode: Response Node (değil) - işlem asenkron olacak

### 2. Validate Table Data - Tablo Kontrolü
**Ne Yapar:**
- Gelen tablo verisinin geçerli bir JSON formatında olduğunu kontrol eder
- Tabloda `columns` ve `rows` alanlarının olduğunu doğrular
- Eğer tablo formatı geçersizse hata mesajı ile callback'e geri döner

**Yapılacaklar:**
- Code node kullan
- Gelen `table_data`'yı kontrol et
- Hata varsa `status: 'failed'` ile callback'e POST yap ve workflow'u durdur

### 3. AI Model Node - Yapay Zeka ile Düzenleme
**Ne Yapar:**
- Tablo verisini ve kullanıcı prompt'unu AI model'e gönderir
- AI'dan düzenlenmiş tabloyu JSON formatında alır

**Yapılacaklar:**
- OpenAI GPT-4, Mistral veya Claude gibi bir AI model node'u kullan
- Prompt şu şekilde olmalı:
  - "Sen bir tablo düzenleme uzmanısın"
  - Mevcut tablo verisini JSON formatında göster
  - Kullanıcının istediğini açıkça belirt
  - AI'dan sadece JSON formatında düzenlenmiş tablo istendiğini belirt
  - Format: `{ "columns": [...], "rows": [...] }`

**Önemli:**
- AI'nın yanıtında sadece JSON olmalı, açıklama metni olmamalı
- Columns yapısını koruması gerektiği belirtilmeli
- Yeni satırlar eklenirse mevcut column yapısına uygun olmalı

### 4. Parse AI Response - AI Yanıtını İşle
**Ne Yapar:**
- AI'dan gelen yanıtı parse eder
- Eğer AI yanıtında JSON dışında metin varsa, sadece JSON kısmını çıkarır
- Düzenlenmiş tablonun geçerli bir format olduğunu kontrol eder
- `columns` ve `rows` alanlarının varlığını doğrular

**Yapılacaklar:**
- Code node kullan
- AI response'u parse et
- JSON içinde markdown code block varsa (```json ... ```) onu çıkar
- Tablo formatını validate et
- Hata varsa `status: 'failed'` ile callback'e dön

### 5. Format Response - Callback İçin Hazırla
**Ne Yapar:**
- Backend'e gönderilecek callback payload'ını hazırlar
- Başarılı sonuç için:
  - `edit_id`: Orijinal edit_id
  - `table_id`: Orijinal table_id
  - `status`: "completed"
  - `edited_table_data`: Düzenlenmiş tablo verisi

**Yapılacaklar:**
- Code node kullan
- Webhook'tan gelen `edit_id`, `table_id`, `callback_url` bilgilerini koru
- Parse edilmiş düzenlenmiş tablo verisini `edited_table_data` olarak ekle

### 6. HTTP Request Node - Backend'e Geri Dönüş
**Ne Yapar:**
- Düzenlenmiş tablo verisini backend'in callback URL'ine POST eder
- Backend bu bilgiyi veritabanına kaydeder ve frontend'e bildirim yapar

**Yapılacaklar:**
- HTTP Request node kullan
- Method: POST
- URL: Webhook'tan gelen `callback_url`
- Body: Format Response node'undan gelen payload
- Headers: `Content-Type: application/json`

## Hata Durumları

### Workflow İçinde Hata Olursa
- Herhangi bir adımda hata oluşursa:
  - Callback URL'ine `status: 'failed'` ve `error_message` ile POST yap
  - Workflow'u durdur

### AI Yanıtı Geçersizse
- Parse edilemezse veya format uygun değilse:
  - Retry mekanizması eklenebilir (max 2 kez)
  - Veya direkt hata mesajı ile callback'e dön

## Workflow Özeti

```
Webhook (POST /table-edit-ai)
  ↓
Validate Table Data (Code Node)
  ↓
AI Model (Edit Table) (AI Node)
  ↓
Parse AI Response (Code Node)
  ↓
Format Response (Code Node)
  ↓
Callback to Backend (HTTP Request)
```

## Dikkat Edilmesi Gerekenler

1. **Asenkron İşlem**: Bu workflow asenkron çalışır. Webhook hemen cevap döndürmez, işlem arka planda devam eder.

2. **Veri Koruma**: Webhook'tan gelen `edit_id`, `table_id`, `callback_url` gibi bilgileri her node'da taşımak gerekir.

3. **Hata Yönetimi**: Her adımda hata kontrolü yapılmalı ve hata durumunda callback'e bildirim gönderilmeli.

4. **AI Prompt Kalitesi**: AI'ya gönderilen prompt net ve açıklayıcı olmalı. Tablonun mevcut yapısını koruması gerektiği belirtilmeli.

5. **JSON Formatı**: AI'dan dönen yanıt mutlaka geçerli JSON olmalı. Markdown içinde gömülü JSON varsa parse edilmeli.

