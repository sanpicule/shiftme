create table if not exists google_calendar_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  return_to text,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table google_calendar_oauth_states enable row level security;
