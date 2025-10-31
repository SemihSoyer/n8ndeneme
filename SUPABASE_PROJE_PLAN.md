# Supabase Tabanlı Belge Analiz Uygulaması Planı

## Proje Hedefi
- Mevcut Cloudflare Workers + D1 + R2 mimarisini, Supabase Postgres veritabanı ve Supabase Storage kullanacak şekilde yeniden inşa etmek.
- Frontend tarafında React/Vite arayüzünü korurken API katmanını Supabase servisleri üzerine taşımak.

## Teknik Varsayımlar
- Supabase projesi oluşturulmuş olacak ve Postgres, Storage, Edge Functions kullanımı mümkün.
- Belgeler Supabase Storage üzerinde saklanacak.
- Yetkilendirme için Supabase Service Role anahtarı backend tarafında güvenle tutulabilecek (örn. Edge Function içinde).
- N8N tarafı mevcut webhook akışını sürdürecek; sadece veritabanı/depoya erişim katmanı değişecek.

## To-Do List
- [ ] Supabase projesini hazırla  
  - [ ] Postgres şema migrasyonlarını planla (documents, chat_messages, generated_tables tabloları)  
  - [ ] Supabase Storage'da `documents` bucket oluştur  
  - [ ] Gerekli RLS politikalarını ve servis rolleri yapılandır

- [ ] Backend mimarisini tasarla  
  - [ ] Supabase Edge Function veya Node/Express sunucusu seçimini netleştir  
  - [ ] Ortak cevap formatı, hata yönetimi ve CORS politikasını belirle  
  - [ ] Konfigürasyon için `.env` dosyası ve Supabase SDK kullanımını planla

- [ ] API uçlarını Supabase'e uyarlayarak uygula  
  - [ ] `/api/upload`: Dosyayı Supabase Storage'a yükle, metadata'yı Postgres'e yaz  
  - [ ] `/api/chat`: Chat kaydını oluştur, Supabase üzerinden tablo durum kaydını başlat, N8N webhook'una çağrı yap  
  - [ ] `/api/chat/:documentId`: Chat geçmişini Postgres'ten kronolojik çek  
  - [ ] `/api/status/:tableId`: Son işlem durumunu ve tablo verisini dön  
  - [ ] `/api/documents/:id/download`: Storage dosyasını güvenli şekilde sun (örn. signed URL veya Edge Function akışı)  
  - [ ] `/api/webhook/n8n`: N8N dönüşünü işleyip Postgres kayıtlarını güncelle

- [ ] Supabase şema ve migrasyon dosyalarını oluştur  
  - [ ] SQL migrasyon dosyaları veya Supabase CLI ile seed/migration script'leri hazırlama  
  - [ ] Index ve foreign key yapısını optimize et  
  - [ ] Gerekirse UUID üretimi için Postgres extension (uuid-ossp) aktifleştir

- [ ] Frontend güncellemelerini yap  
  - [ ] API URL konfigürasyonunu yeni backend adresiyle güncelle  
  - [ ] Upload akışını Supabase signed URL veya doğrudan Edge Function çağrısı ile uyumlu hale getir  
  - [ ] Chat polling mekanizmasının yeni endpointlerle uyumunu doğrula  
  - [ ] Hata ve durum mesajlarını Supabase tabanlı akışa göre tekrar gözden geçir

- [ ] N8N entegrasyonunu revize et  
  - [ ] Webhook payload'larında Supabase tarafında gereken alanları (örn. signed download URL) ekle  
  - [ ] `n8n-code-node.js` skriptini Supabase API formatına göre güncelle  
  - [ ] Edge Function için gerekli API_SECRET doğrulamasını Supabase ortam değişkenleriyle senkronize et

- [ ] Test ve doğrulama adımlarını planla  
  - [ ] Supabase SDK ile unit/integration test senaryolarını belirle  
  - [ ] Frontend için temel e2e veya smoke test adımlarını tanımla  
  - [ ] N8N → Backend → Supabase veri akışını uçtan uca manuel olarak doğrula

- [ ] Deployment sürecini hazırla  
  - [ ] Supabase Edge Function veya seçilen backend için CI/CD adımlarını belirle  
  - [ ] Çevre değişkenleri, API anahtarları ve Supabase URL bilgisini dokümante et  
  - [ ] Production ve staging ortam konfigürasyonlarını ayrı ayrı kaydet

- [ ] Dokümantasyon  
  - [ ] Yeni Supabase mimarisini anlatan README/guide bölümü yaz  
  - [ ] Ortam değişkenleri, komutlar ve sorun giderme notlarını ekle  
  - [ ] Mimari diyagram veya akış şeması güncellemesi gerekiyorsa planla

