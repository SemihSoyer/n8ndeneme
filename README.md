# 📊 Belge Analiz ve Tablo Oluşturma Web Uygulaması

Cloudflare Workers, React ve N8N ile oluşturulmuş belge analiz ve tablo oluşturma uygulaması.

## 🏗️ Proje Yapısı

```
n8n/
├── cloudflare-workers/    # Backend API (Cloudflare Workers)
├── frontend/              # React UI (Vite)
└── n8n-workflow/         # N8N workflow template
```

## 🚀 Kurulum ve Çalıştırma

### 1. Backend (Cloudflare Workers)

**Local Development:**
```bash
cd cloudflare-workers
npm run dev
```
Backend: http://localhost:8787

**Production Deploy:**
```bash
npm run deploy
```

### 2. Frontend (React)

**Local Development:**
```bash
cd frontend
npm run dev
```
Frontend: http://localhost:5173

**Production Build:**
```bash
npm run build
```

### 3. N8N Workflow

1. N8N'i açın (https://your-n8n-instance.com)
2. **Import from File** seçin
3. `n8n-workflow/document-analysis-workflow.json` dosyasını yükleyin
4. Webhook URL'ini kopyalayın
5. Cloudflare Dashboard → Workers → document-analysis-api → Settings → Variables
6. `N8N_WEBHOOK_URL` secret'ını güncelleyin

## 📝 Kullanım

1. **Dosya Yükle:** PDF, JPG veya PNG dosyanızı sürükleyin/seçin
2. **Chat:** "Bu belgeden şu şekilde bir tablo oluştur" yazın
3. **Bekle:** AI tabloyu oluşturacak (mock versiyon 3-5 saniye)
4. **İndir:** Oluşan tabloyu CSV olarak indirin

## 🔧 Yapılandırma

### Cloudflare Workers

`cloudflare-workers/wrangler.toml`:
- D1 Database ID
- R2 Bucket adı
- Environment variables

**Secrets (Dashboard'dan ekleyin):**
- `N8N_WEBHOOK_URL`: N8N webhook URL'i
- `API_SECRET`: API güvenlik anahtarı

### Frontend

Config dosyası: `frontend/src/config.js`
```javascript
export const API_URL = 'http://localhost:8787';
```

Production için:
```javascript
export const API_URL = 'https://document-analysis-api.your-username.workers.dev';
```

## 🗄️ Veritabanı Şeması

D1 Database'de 3 tablo:
- **documents**: Yüklenen belgeler
- **chat_messages**: Chat mesajları
- **generated_tables**: Oluşturulan tablolar

## 🌐 API Endpoints

```
GET  /health                  - Health check
POST /api/upload              - Dosya yükleme
GET  /api/documents/:id       - Belge bilgisi
POST /api/chat                - Chat mesajı gönder
GET  /api/chat/:documentId    - Mesajları getir
POST /api/webhook/n8n         - N8N callback
GET  /api/status/:tableId     - İşlem durumu
```

## 🔄 N8N Workflow (Gerçek AI için)

Mock versiyonu çalışıyor. Gerçek AI entegrasyonu için:

1. **OpenAI Node ekleyin:**
   - "AI Analiz (Mock)" node'unu silin
   - OpenAI/Anthropic node ekleyin
   - Prompt: "Belgeden tablo çıkar: {{$json.user_request}}"

2. **Belge OCR (PDF için):**
   - PDF.co veya Azure Document Intelligence kullanın
   - Metni çıkarıp AI'ya gönderin

3. **R2 Erişimi:**
   - R2 bucket'ı public yapın veya signed URL kullanın

## 🐛 Test

### Backend Test:
```bash
curl http://localhost:8787/health
```

### Upload Test:
```bash
curl -X POST http://localhost:8787/api/upload \
  -F "file=@test.pdf"
```

### Frontend Test:
Tarayıcıda http://localhost:5173 açın

## 📦 Production Deployment

### Backend:
```bash
cd cloudflare-workers
wrangler deploy
```

### Frontend:
```bash
cd frontend
npm run build
# dist/ klasörünü Cloudflare Pages'e deploy edin
```

## 🔐 Güvenlik Notları

- ⚠️ Bu test versiyonudur - authentication yok
- Production için rate limiting ekleyin
- CORS ayarlarını sıkılaştırın
- API_SECRET kullanarak endpoint'leri koruyun

## 🎯 Gelecek Geliştirmeler

- [ ] Gerçek AI entegrasyonu (OpenAI/Anthropic)
- [ ] User authentication
- [ ] Dosya geçmişi
- [ ] Excel export
- [ ] Advanced tablo düzenleme
- [ ] Multi-document analiz

## 🛠️ Teknolojiler

- **Backend:** Cloudflare Workers, D1 Database, R2 Storage
- **Frontend:** React, Vite
- **Automation:** N8N
- **AI:** OpenAI/Anthropic (entegre edilecek)

## 📄 Lisans

MIT

---

**Not:** Bu proje test amaçlıdır. Production kullanımı için ek güvenlik ve optimizasyonlar gereklidir.

