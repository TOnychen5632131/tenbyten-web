-- Create the storage bucket for avatars
-- Note: This requires permissions to insert into storage.buckets. If this fails, create the bucket 'avatars' manually in Supabase Dashboard -> Storage.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policy to allow authenticated users to upload their own avatar
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy to allow public to view avatars
create policy "Anyone can view avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Policy to allow users to update their own avatar
create policy "Users can update their own avatar"
  on storage.objects for update
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
