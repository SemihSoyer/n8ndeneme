# n8n Test Workflow

Bu klasör, Supabase tabanlı backend ile haberleşecek test workflow'unu içerir.

## Yapılacaklar
1. Mevcut `n8n-workflow/document-analysis-workflow.json` dosyasını kopyalayarak buraya getirin.
2. Workflow içindeki şu adımları uyarlayın:
   - Belge indirme adımı: Supabase Storage signed URL veya `/api/documents/:id/download` endpoint'ini kullan.
   - AI işleme adımı: Supabase backend'in döneceği tablo formatıyla (columns + rows) uyumlu çıktılar üret.
   - Webhook dönüşü: Backend'in beklediği `table_id`, `status`, `table_data` alanlarını gönder.
3. n8n tarafında kullanılan webhook URL'sini `.env` içindeki `N8N_WEBHOOK_URL` ile eşleştir.
4. Workflow’u manuel tetikleyerek Supabase backend → n8n → Supabase geri dönüş zincirini test et.

> Bu klasörde ilerleyen adımlarda Code Node scriptleri veya ek dokümantasyon dosyaları tutulacaktır.
