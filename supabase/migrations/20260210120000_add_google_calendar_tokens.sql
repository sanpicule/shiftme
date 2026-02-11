create table if not exists google_calendar_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expiry_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table google_calendar_tokens enable row level security;
