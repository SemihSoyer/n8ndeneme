-- Supabase Postgres şema taslağı (test ortamı)

create extension if not exists "uuid-ossp";

create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  filename text not null,
  file_type text not null,
  storage_path text not null,
  file_size bigint,
  status text default 'uploaded',
  created_at timestamptz default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamptz default now()
);

create table if not exists public.generated_tables (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chat_message_id uuid not null references public.chat_messages(id) on delete cascade,
  table_data jsonb,
  table_url text,
  status text default 'processing',
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists idx_chat_messages_document on public.chat_messages(document_id);
create index if not exists idx_generated_tables_document on public.generated_tables(document_id);
create index if not exists idx_generated_tables_status on public.generated_tables(status);
