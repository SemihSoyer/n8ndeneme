# Frontend (Test Arayüzü)

Bu klasör, Supabase tabanlı backend ile konuşacak **hafif** bir React/Vite uygulaması barındırır. Amaç, belge yükleme + sohbet + tablo görüntüleme adımlarını n8n akışıyla test etmektir.

## Başlangıç Talimatları
1. Terminalde proje köküne gel (`/Users/.../n8n`).
2. Aşağıdaki komutla frontend klasörünü oluştur:
   ```bash
   cd supabase-test/frontend
   npm create vite@latest . -- --template react
   ```
   > `.` (nokta), Vite’in dosyaları mevcut klasöre yazması içindir.
3. Paketleri yükle:
   ```bash
   npm install
   ```
4. `.env` dosyası oluştur ve backend adresini yaz:
   ```env
   VITE_API_URL=http://localhost:8787
   ```
5. Geliştirme sunucusunu başlat:
   ```bash
   npm run dev
   ```
6. Tarayıcıdan verilen adresi aç (`http://localhost:5173`), dosya yükleme ve chat bileşenlerinin backend ile konuşabildiğini test et.

> UI tarafı test için olduğu için tasarım çok basit tutulabilir. Önemli olan, backend uç noktalarının doğru çalıştığını gözlemlemek.
