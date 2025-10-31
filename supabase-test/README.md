# Supabase Test Projesi

Bu klasör, Supabase tabanlı belge analiz uygulamasını **test amacıyla** uçtan uca çalıştırmak için gereken backend ve frontend kodlarını içerir. n8n entegrasyonu sonraya bırakıldı; şu anda veritabanı ve arayüz bileşenleri hazır.

## Yapı

```
supabase-test/
├── backend/    # Express + Supabase Postgres/Storage API
├── frontend/   # React/Vite test arayüzü
├── n8n/        # (ileride) workflow dosyaları
└── supabase/   # SQL şema dosyaları
```

## Çalışma Akışı

1. **Supabase**: `supabase/schema.sql` içeriğini projenize uygulayın, `documents` adlı private bucket oluşturun.
2. **Backend**: `supabase-test/backend/README.md` adımlarını izleyerek `.env` oluşturun ve `npm run dev` ile API'yi başlatın.
3. **Frontend**: `supabase-test/frontend/README.md` adımlarındaki gibi `npm install` ardından `npm run dev` çalıştırın.
4. Tarayıcıdan arayüze girip dosya yükleyin, chat isteği gönderin ve Supabase tablolarında kayıtların oluştuğunu doğrulayın.

Bu yapı yalnızca test ortamı içindir; üretime almadan önce ek güvenlik ve gözden geçirme yapılmalıdır.
