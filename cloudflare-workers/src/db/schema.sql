-- documents tablosu
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  file_size INTEGER,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'uploaded'
);

-- chat_messages tablosu
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- generated_tables tablosu
CREATE TABLE generated_tables (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chat_message_id TEXT NOT NULL,
  table_data TEXT,
  table_url TEXT,
  status TEXT DEFAULT 'processing',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  error_message TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (chat_message_id) REFERENCES chat_messages(id)
);

-- export_jobs tablosu (GELECEK İÇİN - ŞİMDİLİK KULLANILMIYOR)
-- CREATE TABLE export_jobs (
--   id TEXT PRIMARY KEY,
--   table_id TEXT NOT NULL,
--   format TEXT NOT NULL,
--   status TEXT DEFAULT 'pending',
--   r2_key TEXT,
--   file_url TEXT,
--   file_size INTEGER,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   started_at DATETIME,
--   completed_at DATETIME,
--   error_message TEXT,
--   FOREIGN KEY (table_id) REFERENCES generated_tables(id)
-- );

-- İndeks'ler (performans için)
CREATE INDEX idx_chat_messages_document ON chat_messages(document_id);
CREATE INDEX idx_generated_tables_document ON generated_tables(document_id);
CREATE INDEX idx_generated_tables_status ON generated_tables(status);
-- CREATE INDEX idx_export_jobs_table ON export_jobs(table_id);
-- CREATE INDEX idx_export_jobs_status ON export_jobs(status);
-- CREATE INDEX idx_export_jobs_created ON export_jobs(created_at DESC);
