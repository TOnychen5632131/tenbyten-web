-- Reset Tables (CAUTION: DELETES ALL DATA)
DROP TABLE IF EXISTS invite_codes CASCADE;
DROP TABLE IF EXISTS vendor_profiles CASCADE;

-- Create a table for invite codes
create table invite_codes (
  code text primary key,
  is_used boolean default false,
  created_at timestamptz default now()
);

-- Basic RLS for invite_codes
alter table invite_codes enable row level security;

-- Allow anyone to read invite codes (to check validity)
create policy "Anyone can check invite codes"
  on invite_codes for select
  using (true);

-- Allow authenticated users to mark codes as used
create policy "Authenticated users can update invite codes"
  on invite_codes for update
  using (true);

-- Create a table for vendor profiles
create table vendor_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  brand_name text,
  product_description text,
  avatar_url text,
  top_markets text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Basic RLS for vendor_profiles
alter table vendor_profiles enable row level security;

-- Users can view any profile (public)
create policy "Public profiles are viewable by everyone"
  on vendor_profiles for select
  using (true);

-- Users can insert their own profile
create policy "Users can insert their own profile"
  on vendor_profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update their own profile"
  on vendor_profiles for update
  using (auth.uid() = id);

-- Function to handle new user profile creation automatically (optional, but we are doing manual onboarding)
-- So we won't add a trigger for auto-creation, as we want to force the onboarding flow.

-- Initial invite codes for testing
insert into invite_codes (code) values 
('1010'),
('WELCOME2025'),
('SEATTLE_MARKET'),
('VINTAGE_LOVE'),
('TEST_VENDOR_01'),
('TEST_VENDOR_02');
