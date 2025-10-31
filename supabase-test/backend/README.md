# Backend Kurulum Rehberi (Test Ortamı)

Bu doküman, **hiç deneyimi olmayan biri** bile rahatça takip etsin diye adım adım yazıldı.

---

## 1. Supabase Projesini Hazırla
1. [Supabase](https://supabase.com/) hesabına giriş yap ve “New project” butonuna tıkla.
2. Projeye bir isim ver (ör. `document-analysis-test`).
3. Oluşan projeye girdikten sonra:
   - Sol menüden **Storage → Buckets** bölümüne git, `documents` isminde **private** bir bucket oluştur.
   - Sol menüden **SQL Editor**’e geç, `../supabase/schema.sql` dosyasındaki SQL komutlarını yapıştır ve çalıştır. Böylece `documents`, `chat_messages`, `generated_tables` tabloları hazır olur.

## 2. Gerekli Anahtarları Not Et
1. **Project Settings → API** sayfasına git.
2. Şu değerleri bir kenara yaz:
   - `Project URL`
   - `anon public` anahtarı
   - `service_role` anahtarı (bu anahtar gizlidir, kimseyle paylaşma).

## 3. Depoya Bağımlılıkları Kur
1. Terminali aç ve proje kökünde olduğundan emin ol (`/Users/.../n8n`).
2. Aşağıdaki komutla backend klasörüne gir ve paketleri kur:
   ```bash
   cd supabase-test/backend
   npm install
   ```

## 4. Çevre Değişkenlerini Tanımla
1. `.env.example` dosyasını kopyalayıp `.env` olarak kaydet:
   ```bash
   cp .env.example .env
   ```
2. Dosyayı aç ve Supabase’ten aldığın değerleri doldur:
   ```env
   SUPABASE_URL=... (Project URL)
   SUPABASE_SERVICE_ROLE_KEY=... (service_role)
   SUPABASE_ANON_KEY=... (anon public)
   SUPABASE_BUCKET=documents
   API_PORT=8787
   API_SECRET=super-gizli-bir-şey
   N8N_WEBHOOK_URL=https://... (n8n webhook adresin)
   ```

## 5. Sunucuyu Çalıştır
1. Hâlâ `supabase-test/backend` klasöründeyken şu komutu çalıştır:
   ```bash
   npm run dev
   ```
2. Konsolda `API server listening on port 8787` mesajını gördüğünde API hazır demektir.
3. Tarayıcıda `http://localhost:8787/` adresine giderek `status: ok` cevabını kontrol et.

## 6. Test Uç Noktaları
- **Dosya Yükle:**
  ```bash
  curl -X POST http://localhost:8787/api/upload \
    -H "Accept: application/json" \
    -F "file=@/path/to/test.pdf"
  ```
- **Sohbet Başlat:**
  ```bash
  curl -X POST http://localhost:8787/api/chat \
    -H "Content-Type: application/json" \
    -d '{"documentIds": ["<belge-id>"], "message": "Bu belgeden tablo çıkar"}'
  ```
- **Durum Sorgula:**
  ```bash
  curl http://localhost:8787/api/status/<table-id>
  ```

> Not: Bu API test amaçlıdır. Üretim ortamına almadan önce ek güvenlik, rate limiting ve hata yönetimi eklenmelidir.
