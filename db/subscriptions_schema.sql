-- Create a type for subscription status if it doesn't exist
do $$ begin
    create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused');
exception
    when duplicate_object then null;
end $$;

-- Create subscriptions table
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status subscription_status,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table subscriptions enable row level security;

-- Policies
create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage all subscriptions"
  on subscriptions for all
  using (true);
