-- PickMyAgent community board.
-- Free-tier Supabase: Postgres, Auth, and row level security. No storage, no paid add-ons.
-- Members post through the anon key. Hiding a post is done with the service role after
-- the app checks the ADMIN_EMAILS env var.

create table public.categories (
  slug text primary key,
  title text not null,
  description text not null,
  sort_order integer not null unique
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null references public.categories (slug),
  author_id uuid not null references public.profiles (id),
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  hidden boolean not null default false,
  constraint threads_title_length check (char_length(btrim(title)) between 8 and 120),
  constraint threads_body_length check (char_length(btrim(body)) between 1 and 4000)
);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now(),
  hidden boolean not null default false,
  constraint replies_body_length check (char_length(btrim(body)) between 1 and 4000)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id),
  thread_id uuid references public.threads (id) on delete cascade,
  reply_id uuid references public.replies (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  constraint reports_one_target check (
    (thread_id is not null and reply_id is null)
    or (thread_id is null and reply_id is not null)
  ),
  constraint reports_note_length check (note is null or char_length(note) <= 280)
);

create unique index reports_one_thread_per_member
  on public.reports (reporter_id, thread_id)
  where thread_id is not null;

create unique index reports_one_reply_per_member
  on public.reports (reporter_id, reply_id)
  where reply_id is not null;

create index threads_visible_activity
  on public.threads (last_activity_at desc)
  where hidden = false;

create index threads_visible_category
  on public.threads (category_slug, last_activity_at desc)
  where hidden = false;

create index replies_visible_thread
  on public.replies (thread_id, created_at)
  where hidden = false;

insert into public.categories (slug, title, description, sort_order) values
  ('tool-debates', 'Tool debates', 'Which tool fits a real job, and where it falls short.', 1),
  ('favorites', 'Favorites', 'Tools you still use after the trial.', 2),
  ('creator-help', 'Creator help', 'Practical questions about making something with AI.', 3),
  ('gaming-streaming', 'Gaming & streaming', 'Clips, VODs, and stream workflows.', 4),
  ('new-releases', 'New releases', 'New tools worth a look, and ones that can wait.', 5);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen text;
begin
  chosen := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data->>'name'), ''),
    nullif(btrim(new.raw_user_meta_data->>'preferred_username'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Member'
  );
  chosen := left(chosen, 80);
  insert into public.profiles (user_id, display_name)
  values (new.id, chosen)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.enforce_post_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  profile_user uuid;
  account_created timestamptz;
  recent_count integer;
  link_count integer;
  haystack text;
begin
  uid := auth.uid();
  -- SQL editor and the service role have no member session. Member posts always do.
  if uid is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(uid::text)::bigint);

  select user_id into profile_user
  from public.profiles
  where id = new.author_id;

  if profile_user is distinct from uid then
    raise exception 'You can only post as yourself';
  end if;

  select created_at into account_created
  from auth.users
  where id = uid;

  select
    (
      select count(*)
      from public.threads as thread
      join public.profiles as profile on profile.id = thread.author_id
      where profile.user_id = uid
        and thread.created_at > now() - interval '10 minutes'
    )
    +
    (
      select count(*)
      from public.replies as reply
      join public.profiles as profile on profile.id = reply.author_id
      where profile.user_id = uid
        and reply.created_at > now() - interval '10 minutes'
    )
  into recent_count;

  if recent_count >= 5 then
    raise exception 'Rate limit: 5 posts every 10 minutes';
  end if;

  if tg_table_name = 'threads' then
    haystack := new.title || ' ' || new.body;
  else
    haystack := new.body;
  end if;

  link_count := array_length(regexp_split_to_array(lower(haystack), 'https?://'), 1) - 1;

  if account_created > now() - interval '7 days' and link_count > 1 then
    raise exception 'New accounts can include at most one link';
  end if;

  return new;
end;
$$;

create trigger threads_enforce_rules
  before insert on public.threads
  for each row execute function public.enforce_post_rules();

create trigger replies_enforce_rules
  before insert on public.replies
  for each row execute function public.enforce_post_rules();

create or replace function public.touch_thread_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.threads
  set last_activity_at = new.created_at
  where id = new.thread_id;
  return new;
end;
$$;

create trigger replies_touch_thread
  after insert on public.replies
  for each row execute function public.touch_thread_activity();

alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.threads enable row level security;
alter table public.replies enable row level security;
alter table public.reports enable row level security;

create policy categories_read
  on public.categories
  for select
  to anon, authenticated
  using (true);

create policy profiles_read
  on public.profiles
  for select
  to anon, authenticated
  using (true);

create policy threads_read
  on public.threads
  for select
  to anon, authenticated
  using (hidden = false);

create policy threads_insert
  on public.threads
  for insert
  to authenticated
  with check (
    hidden = false
    and author_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

create policy replies_read
  on public.replies
  for select
  to anon, authenticated
  using (
    hidden = false
    and exists (
      select 1
      from public.threads
      where threads.id = replies.thread_id
        and threads.hidden = false
    )
  );

create policy replies_insert
  on public.replies
  for insert
  to authenticated
  with check (
    hidden = false
    and author_id in (
      select id from public.profiles where user_id = auth.uid()
    )
    and exists (
      select 1
      from public.threads
      where threads.id = replies.thread_id
        and threads.hidden = false
    )
  );

create policy reports_insert
  on public.reports
  for insert
  to authenticated
  with check (
    reporter_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

create policy reports_read_own
  on public.reports
  for select
  to authenticated
  using (
    reporter_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

revoke all on public.categories from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
revoke all on public.threads from anon, authenticated;
revoke all on public.replies from anon, authenticated;
revoke all on public.reports from anon, authenticated;

grant select on public.categories to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.threads to anon, authenticated;
grant insert on public.threads to authenticated;
grant select on public.replies to anon, authenticated;
grant insert on public.replies to authenticated;
grant select, insert on public.reports to authenticated;
grant all on public.categories, public.profiles, public.threads, public.replies, public.reports to service_role;
