-- Enable pgvector extension to work with embeddings
create extension if not exists vector;

-- Add embedding column to sales_opportunities
-- 'text-embedding-3-small' has 1536 dimensions
alter table sales_opportunities 
add column if not exists embedding vector(1536);

-- Create a function to search for opportunities
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
  order by sales_opportunities.embedding <=> query_embedding
  limit match_count;
end;
$$;
