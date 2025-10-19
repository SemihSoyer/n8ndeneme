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

-- İndeks'ler (performans için)
CREATE INDEX idx_chat_messages_document ON chat_messages(document_id);
CREATE INDEX idx_generated_tables_document ON generated_tables(document_id);
CREATE INDEX idx_generated_tables_status ON generated_tables(status);

