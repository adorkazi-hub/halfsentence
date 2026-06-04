-- ═══════════════════════════════════════════════════════
--  halfsentence · Supabase Database Setup
--  Run this entire file in: Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════

-- ── POSTS ────────────────────────────────────────────────
create table if not exists posts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text,
  excerpt      text,
  cover_url    text,
  category     text,
  slug         text unique,
  tags         text[],
  status       text default 'draft' check (status in ('draft','published','scheduled')),
  scheduled_at timestamptz,
  views        integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- ── REACTIONS ────────────────────────────────────────────
create table if not exists reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts(id) on delete cascade,
  type       text check (type in ('like','hate')),
  session_id text,
  created_at timestamptz default now()
);

-- One reaction per session per post per type
create unique index if not exists reactions_unique
  on reactions (post_id, type, session_id);

-- ── COMMENTS ─────────────────────────────────────────────
create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts(id) on delete cascade,
  author     text,
  body       text not null,
  status     text default 'pending' check (status in ('pending','approved','spam')),
  created_at timestamptz default now()
);

-- ── READERS CORNER POSTS ─────────────────────────────────
create table if not exists readers_posts (
  id         uuid primary key default gen_random_uuid(),
  type       text check (type in ('review','discussion','recommendation')),
  title      text not null,
  body       text,
  book_title text,
  author     text,
  votes      integer default 0,
  created_at timestamptz default now()
);

-- ── INCREMENT VIEWS FUNCTION ──────────────────────────────
-- This lets us safely increment view count from the frontend
create or replace function increment_views(post_id uuid)
returns void as $$
begin
  update posts set views = views + 1 where id = post_id;
end;
$$ language plpgsql security definer;

-- ── ROW LEVEL SECURITY ────────────────────────────────────
-- Enable RLS on all tables
alter table posts          enable row level security;
alter table reactions      enable row level security;
alter table comments       enable row level security;
alter table readers_posts  enable row level security;

-- PUBLIC can read published posts
create policy "Public can read published posts"
  on posts for select
  using (status = 'published');

-- AUTHENTICATED (admin) can do everything on posts
create policy "Admin full access to posts"
  on posts for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- PUBLIC can read approved comments
create policy "Public can read approved comments"
  on comments for select
  using (status = 'approved');

-- PUBLIC can insert comments (goes to pending)
create policy "Public can submit comments"
  on comments for insert
  with check (true);

-- AUTHENTICATED can manage all comments
create policy "Admin manages comments"
  on comments for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- PUBLIC can read and insert reactions
create policy "Public can read reactions"
  on reactions for select using (true);

create policy "Public can add reactions"
  on reactions for insert with check (true);

create policy "Public can remove their own reactions"
  on reactions for delete using (true);

-- PUBLIC can read and insert readers posts
create policy "Public can read readers posts"
  on readers_posts for select using (true);

create policy "Public can submit readers posts"
  on readers_posts for insert with check (true);

create policy "Public can vote on readers posts"
  on readers_posts for update
  using (true)
  with check (true);

-- AUTHENTICATED can delete readers posts
create policy "Admin can delete readers posts"
  on readers_posts for delete
  using (auth.role() = 'authenticated');

-- ── STORAGE BUCKET ────────────────────────────────────────
-- Run this separately in Supabase → Storage → New Bucket
-- Name: covers
-- Public: YES
-- Or insert via SQL:
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Allow public to read cover images
create policy "Public can view covers"
  on storage.objects for select
  using (bucket_id = 'covers');

-- Allow authenticated (admin) to upload/delete
create policy "Admin can upload covers"
  on storage.objects for insert
  with check (bucket_id = 'covers' and auth.role() = 'authenticated');

create policy "Admin can delete covers"
  on storage.objects for delete
  using (bucket_id = 'covers' and auth.role() = 'authenticated');

-- ── SAMPLE DATA (Optional — delete if not needed) ─────────
insert into posts (title, excerpt, category, status, tags, views, body) values
(
  'On the strange comfort of uncertainty',
  'We spend so much of our lives seeking answers. But what if the discomfort of not knowing is precisely where life happens?',
  'Philosophy',
  'published',
  array['philosophy','uncertainty','life'],
  4821,
  '<p>We spend so much of our lives seeking answers — certainty in relationships, clarity in career paths, the assurance that we have made the right calls. But what if the discomfort of not knowing is precisely where life happens?</p><blockquote>The only true wisdom is in knowing you know nothing. — Socrates</blockquote><h2>The tyranny of resolution</h2><p>There is a particular cultural pressure to have things figured out. Your five-year plan. Your personal brand. Your identity, neatly packaged. We treat ambiguity as a failure state rather than what it actually is — the natural condition of being alive and paying attention.</p>'
),
(
  'The slow death of boredom and what we lose with it',
  'Every idle moment is now colonised by a screen. We have optimised away the emptiness that used to make us creative.',
  'Culture',
  'published',
  array['culture','technology','attention'],
  3940,
  '<p>There used to be gaps in the day. Waiting for the bus. Sitting in a queue. Lying in the dark before sleep arrived. These were not wasted moments — they were the moments in which the mind wandered, and wandering was where ideas came from.</p><p>We have filled every gap. The phone is always there, always offering something — a video, a message, a scroll through other people''s lives. And in doing so, we have quietly abolished the state that made us most creative.</p>'
);
