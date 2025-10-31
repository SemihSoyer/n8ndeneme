<!-- b141a38a-3a11-4a01-a98d-fa48d94cc55a 99029cbe-0485-457d-9c58-5ebed4201b82 -->
# Template Seçim Sistemi Ekleme Planı

## Genel Bakış

Belge yükleme sonrası, chat arayüzü açılmadan önce kullanıcı bir template seçecek. Seçilen template bilgisi backend'e ve n8n workflow'una gönderilecek. Her template için farklı AI prompt'u kullanılacak.

## Değişiklikler

### 1. Frontend Değişiklikleri

#### 1.1 Yeni Component: TemplateSelector

- **Dosya**: `frontend/src/components/TemplateSelector.jsx` ve `TemplateSelector.css`
- **Özellikler**:
  - 5 template kartı gösterir (Fatura, Fiş Dekont, Tablo, Sözleşme, Genel Analiz)
  - Her kart görsel ve ikon içerir
  - Seçim zorunlu, seçilmeden devam edilemez
  - Seçilen template'i vurgular
  - "Devam Et" butonu sadece template seçildikten sonra aktif olur

#### 1.2 App.jsx Güncellemesi

- Template seçimi state'i ekle (`selectedTemplate`)
- Akış: `FileUpload` → `TemplateSelector` → `ChatInterface`
- Template bilgisini `ChatInterface`'e prop olarak geçir

#### 1.3 ChatInterface.jsx Güncellemesi

- Template bilgisini `sendChatMessage` API çağrısına ekle
- Template bilgisini API'ye gönder

#### 1.4 API Service Güncellemesi

- **Dosya**: `frontend/src/services/api.js`
- `sendChatMessage` fonksiyonuna `template` parametresi ekle
- Backend'e template bilgisini gönder

### 2. Backend Değişiklikleri (Cloudflare Workers)

#### 2.1 Chat Handler Güncellemesi

- **Dosya**: `cloudflare-workers/src/handlers/chat.js`
- Request body'den `template` parametresini al
- Template validation ekle (5 template'den biri olmalı)
- N8N webhook payload'ına `template` ekle

### 3. N8N Workflow Değişiklikleri

#### 3.1 Template Bilgisini Webhook'tan Alma ve Saklama

- **Node**: "Split Document IDs1" Code node'unu güncelle
- Template bilgisini webhook body'den al ve her item'a ekle
- Her document için template bilgisi korunur

#### 3.2 Template Routing (Combine Pages ve Process Mistral Text sonrası)

- **Konum**: "Combine Pages1" ve "Process Mistral Text1" node'larından sonra, "Message a model1" yerine
- **Node**: Mevcut "Message a model1" node'unu sil
- **Yeni Node**: "Template Router" (Switch veya IF node)
- Template bilgisine göre 5 farklı yola ayır

#### 3.3 Template-Specific Prompt Nodes

- Her template için ayrı "Message a model" node'u oluştur:
  - **Message a model - Fatura**: Fatura analizi için özel prompt
  - **Message a model - Fiş Dekont**: Fiş/dekont analizi için özel prompt
  - **Message a model - Tablo**: Tablo çıkarımı için özel prompt
  - **Message a model - Sözleşme**: Sözleşme analizi için özel prompt
  - **Message a model - Genel Analiz**: Genel analiz için özel prompt (mevcut prompt)
- Her node'un prompt'u template'e özel olacak
- Tüm template node'ları "Loop Over Items1" node'una geri bağlanır (loop'un devamı için)

#### 3.4 Güncellenmiş Workflow Yapısı

```
Webhook1 → Split Document IDs1 (template bilgisini ekle) → Loop Over Items1 
   → Belgeyi İndir (R2)1 → PDF Kontrol1 → PDF mi?1 
      ├─ TRUE (PDF) → Upload Mistral1 → Signed URL1 → mistral OCR1 → Process Mistral Text1 ─┐
      └─ FALSE (Görsel) → Extract from File1 → Google Vision API1 → Combine Pages1 ─────────┘
                                                                                              │
                        ┌─────────────────────────────────────────────────────────────────────┘
                        ↓
                   Template Router (Switch/IF)
                        ├─ Fatura → Message a model (Fatura) ─┐
                        ├─ Fiş Dekont → Message a model (Fiş Dekont) ─┤
                        ├─ Tablo → Message a model (Tablo) ─┤
                        ├─ Sözleşme → Message a model (Sözleşme) ─┤
                        └─ Genel Analiz → Message a model (Genel Analiz) ─┤
                                                                            ↓
                                                              Loop Over Items1 (loop back)
                                                                            ↓
                                                                   Combine Results1
                                                                            ↓
                                                                    HTTP Request1
```

## Template Tanımları

1. **Fatura**: Fatura numarası, tarih, müşteri bilgileri, ürünler, toplam tutar vb.
2. **Fiş Dekont**: İşlem tarihi, tutar, işlem tipi, ödeme yöntemi vb.
3. **Tablo**: Belgedeki tüm tabloları çıkarır
4. **Sözleşme**: Taraflar, tarih, maddeler, imzalar vb.
5. **Genel Analiz**: Mevcut prompt (esnek, kullanıcı isteğine göre)

## Dosya Değişiklikleri Özeti

**Yeni Dosyalar:**

- `frontend/src/components/TemplateSelector.jsx`
- `frontend/src/components/TemplateSelector.css`

**Güncellenecek Dosyalar:**

- `frontend/src/App.jsx`
- `frontend/src/components/ChatInterface.jsx`
- `frontend/src/services/api.js`
- `cloudflare-workers/src/handlers/chat.js`
- `29 EKİM 18.03.json` (n8n workflow dosyası)

## Notlar

- Template seçimi zorunlu, kullanıcı seçmeden chat'e geçemez
- Template bilgisi tüm akışta korunur (frontend → backend → n8n)
- Her template için özel prompt'lar n8n workflow'unda tanımlanır
- UI kartları responsive ve modern tasarıma uygun olacak

### To-dos

- [ ] TemplateSelector component'i oluştur (JSX ve CSS) - 5 template kartı, zorunlu seçim, devam butonu
- [ ] App.jsx'te template seçim akışını ekle - FileUpload → TemplateSelector → ChatInterface
- [ ] ChatInterface'te template bilgisini API çağrısına ekle
- [ ] api.js'te sendChatMessage fonksiyonuna template parametresi ekle
- [ ] Backend chat.js handler'ına template parametresi ve validation ekle, n8n payload'ına ekle
- [ ] N8N workflow'a Template Check code node ekle (Split Document IDs1 sonrası)
- [ ] N8N workflow'a Template Routing IF node ekle (5 çıktı ile)
- [ ] Her template için ayrı Message a model node oluştur ve özel promptlar ekle (5 node)
- [ ] Template prompt node'larını Loop Over Items1'e bağla






