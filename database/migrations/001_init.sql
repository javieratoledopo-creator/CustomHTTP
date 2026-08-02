-- CUSTOM HTTP :: esquema inicial
create extension if not exists "pgcrypto";

create table if not exists admins (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  active        boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists servers (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  host            text not null,
  port            integer not null default 443,
  protocol        text not null default 'https',
  https_url       text,
  active          boolean not null default true,
  description     text,
  last_status     text,
  last_checked_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  password_hash text not null,
  server_id     uuid references servers(id) on delete set null,
  active        boolean not null default true,
  starts_at     timestamptz,
  expires_at    timestamptz,
  max_sessions  integer,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists users_username_lower_idx on users (lower(username));

create table if not exists sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  server_id       uuid references servers(id) on delete set null,
  token_hash      text not null unique,
  status          text not null default 'active',
  network_type    text,
  ip              text,
  user_agent      text,
  connected_at    timestamptz,
  disconnected_at timestamptz,
  closed_at       timestamptz,
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions (user_id, status);

create table if not exists configs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  server_id    uuid references servers(id) on delete set null,
  config_id    text not null unique,
  token_hash   text not null,
  revoked      boolean not null default false,
  revoked_at   timestamptz,
  verified_at  timestamptz,
  verify_count integer not null default 0,
  created_by   text,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);
create index if not exists configs_user_idx on configs (user_id);

create table if not exists connection_log (
  id           bigserial primary key,
  session_id   uuid references sessions(id) on delete set null,
  user_id      uuid references users(id) on delete cascade,
  server_id    uuid references servers(id) on delete set null,
  event        text not null,
  network_type text,
  ip           text,
  created_at   timestamptz not null default now()
);
create index if not exists connection_log_created_idx on connection_log (created_at desc);

create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

insert into settings (key, value) values
  ('api_url', ''),
  ('main_domain', ''),
  ('session_ttl_minutes', '720'),
  ('config_ttl_hours', '168'),
  ('require_https', 'true'),
  ('allow_user_config_export', 'true')
on conflict (key) do nothing;
