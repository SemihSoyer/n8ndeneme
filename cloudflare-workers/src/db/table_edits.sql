-- table_edits tablosu (AI tablo düzenleme için)
-- Eğer tablo zaten varsa bu komut hata verecek, o zaman sadece index'leri çalıştırın
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
  error_message TEXT,
  FOREIGN KEY (table_id) REFERENCES generated_tables(id),
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE INDEX IF NOT EXISTS idx_table_edits_table ON table_edits(table_id);
CREATE INDEX IF NOT EXISTS idx_table_edits_status ON table_edits(status);

