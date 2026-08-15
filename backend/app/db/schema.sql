create extension if not exists vector;

create table if not exists documents(
    id uuid primary key default gen_random_uuid(),
    title text not null,
    source_path text not null,
    uploaded_at timestamptz not null default now()
);

create table if not exists chunks(
    id uuid primary key default gen_random_uuid(),
    doc_id uuid not null references documents(id) on delete cascade,
    chunk_index int not null,
    text text not null,
    page_or_section text,
    embedding vector(768),
    tsv tsvector generated always as (to_tsvector('english', text)) stored,
    created_at timestamptz not null default now()
);

create index if not exists idx_chunks_embedding on chunks using hnsw(embedding vector_cosine_ops);

create index if not exists idx_chunks_tsv on chunks using gin (tsv);

create index if not exists idx_chunks_doc_id on chunks(doc_id);