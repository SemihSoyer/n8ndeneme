-- table_edits tablosu (AI tablo düzenleme için)
-- FOREIGN KEY constraint'leri kaldırıldı (Cloudflare D1 uyumluluğu için)

CREATE TABLE IF NOT EXISTS table_edits (
  id TEXT PRIMARY KEY,
  table_id TEXT NOT NULL,
  document_id TEXT,
  original_table_data TEXT NOT NULL,
  edited_table_data TEXT,
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_table_edits_table ON table_edits(table_id);
CREATE INDEX IF NOT EXISTS idx_table_edits_status ON table_edits(status);

