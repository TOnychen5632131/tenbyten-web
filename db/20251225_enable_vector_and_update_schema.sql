-- Enable the vector extension to work with embeddings
create extension if not exists vector;

-- Add start and end dates for seasonal markets
alter table market_details 
add column if not exists season_start_date date,
add column if not exists season_end_date date;

-- Add embedding column to sales_opportunities
-- Using 1536 dimensions for text-embedding-3-small
alter table sales_opportunities 
add column if not exists embedding vector(1536);

-- Create an arrow index for faster vector search 
-- (HNSW is generally preferred but checking if ivfflat is better for small datasets? HNSW is fine)
create index if not exists sales_opportunities_embedding_idx 
on sales_opportunities 
using hnsw (embedding vector_cosine_ops);

-- Create a function to search opportunities by similarity
create or replace function match_opportunities (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  description text,
  type text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    sales_opportunities.id,
    sales_opportunities.title,
    sales_opportunities.description,
    sales_opportunities.type,
    1 - (sales_opportunities.embedding <=> query_embedding) as similarity
  from sales_opportunities
  where 1 - (sales_opportunities.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
