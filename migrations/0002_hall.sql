create table if not exists profiles (
  user_id text primary key,
  display_name text not null,
  friend_code text not null unique,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists friendships (
  id text primary key,
  requester_id text not null,
  addressee_id text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists friendships_pair_idx
  on friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create table if not exists challenges (
  id text primary key,
  from_id text not null,
  to_id text not null,
  from_color text not null,
  status text not null,
  game_id text,
  created_at timestamptz not null default now()
);

create index if not exists challenges_to_idx on challenges (to_id, status);
create index if not exists challenges_from_idx on challenges (from_id, status);

create table if not exists games (
  id text primary key,
  white_id text not null,
  black_id text not null,
  white_name text not null,
  black_name text not null,
  fen text not null,
  pgn text not null default '',
  status text not null,
  result text,
  reason text,
  draw_offer text,
  watchable boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists games_live_idx on games (status, updated_at desc);
create index if not exists games_white_idx on games (white_id, status);
create index if not exists games_black_idx on games (black_id, status);

create table if not exists game_moves (
  id serial primary key,
  game_id text not null,
  ply integer not null,
  san text not null,
  fen text not null,
  by_id text not null
);

create index if not exists game_moves_game_idx on game_moves (game_id, ply);
