-- ═══════════════════════════════════════════════════════
--  halfsentence · Run once in Supabase SQL Editor
--  Fixes admin post saves + adds About/Contact settings
-- ═══════════════════════════════════════════════════════

-- ── SITE SETTINGS (About page + contact) ───────────────
create table if not exists site_settings (
  id               int primary key default 1,
  site_name        text default 'halfsentence',
  tagline          text,
  posts_per_page   int default 10,
  author_name      text,
  author_bio       text,
  author_email     text,
  about_html       text,
  link_twitter     text,
  link_goodreads   text,
  link_newsletter  text,
  updated_at       timestamptz default now(),
  constraint site_settings_singleton check (id = 1)
);

insert into site_settings (id, site_name, tagline, author_name, author_bio, author_email, about_html)
values (
  1,
  'halfsentence',
  'Writer. Reader. Someone who thinks too much and sleeps too little.',
  'halfsentence',
  'Writer. Reader. Someone who thinks too much and sleeps too little.',
  'hello@halfsentence.com',
  '<p>I started this space because I needed somewhere to put my thoughts that wasn''t Twitter — somewhere that rewards slowness, doesn''t optimise for engagement, and doesn''t shorten what needs to be long.</p><p>I write about the books I''m reading, the ideas that won''t leave me alone, and the ordinary experiences that seem to contain more than they let on at first glance. Occasionally I write about technology, mostly with suspicion.</p><h2>About this site</h2><p>This is a blog in the old sense — a personal corner of the internet where I share things without a strategy. There''s also a <strong>Readers'' Corner</strong> — a community space where anyone can post book reviews, share recommendations, and start discussions.</p><h2>The name</h2><p><em>halfsentence</em> — because the best ideas often arrive incomplete.</p><h2>On disagreement</h2><p>I''ve turned on both likes and dislikes on posts. If you disagree with something I''ve written, I want to know.</p>'
)
on conflict (id) do nothing;

alter table site_settings enable row level security;

drop policy if exists "Public read settings" on site_settings;
drop policy if exists "Auth manage settings" on site_settings;

create policy "Public read settings"
  on site_settings for select
  using (true);

create policy "Auth manage settings"
  on site_settings for all
  to authenticated
  using (true)
  with check (true);

-- ── POSTS · clearer admin policies ─────────────────────
drop policy if exists "Admin full access to posts" on posts;

create policy "Admin full access to posts"
  on posts for all
  to authenticated
  using (true)
  with check (true);

-- ── VIEW COUNTER · allow public RPC ─────────────────────
grant execute on function public.increment_views(uuid) to anon, authenticated;

-- ── STORAGE · allow authenticated updates (replace cover) ─
drop policy if exists "Admin can update covers" on storage.objects;
create policy "Admin can update covers"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'covers')
  with check (bucket_id = 'covers');
