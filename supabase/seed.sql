-- Starter threads from the PickMyAgent team.
-- These are questions for members. They are not posts from real users.
-- Run this once in the Supabase SQL editor after the community migration.

insert into public.profiles (id, user_id, display_name)
values (
  'a0000000-0000-4000-8000-000000000001',
  null,
  'PickMyAgent team'
)
on conflict (id) do nothing;

insert into public.threads (
  id,
  category_slug,
  author_id,
  title,
  body,
  created_at,
  last_activity_at
) values
  (
    'b0000000-0000-4000-8000-000000000001',
    'tool-debates',
    'a0000000-0000-4000-8000-000000000001',
    'Which clip tool actually fits a weekly gaming stream?',
    $body$This is a starter question from the PickMyAgent team, not a member review.

If you turn gaming streams into highlight reels, which tool did the cutting, and where did it waste your time?$body$,
    '2026-10-16T21:00:00Z',
    '2026-10-16T21:00:00Z'
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'favorites',
    'a0000000-0000-4000-8000-000000000001',
    'What AI tool did you keep after the trial ended?',
    $body$This is a starter question from the PickMyAgent team, not a member review.

Which tool was still worth paying for once the trial ended, and what job does it cover for you?$body$,
    '2026-10-16T21:01:00Z',
    '2026-10-16T21:01:00Z'
  ),
  (
    'b0000000-0000-4000-8000-000000000003',
    'creator-help',
    'a0000000-0000-4000-8000-000000000001',
    'Where do you start when the free plan is too small?',
    $body$This is a starter question from the PickMyAgent team, not a member review.

When a video or caption tool's free plan runs out mid-project, what do you do next?$body$,
    '2026-10-16T21:02:00Z',
    '2026-10-16T21:02:00Z'
  ),
  (
    'b0000000-0000-4000-8000-000000000004',
    'gaming-streaming',
    'a0000000-0000-4000-8000-000000000001',
    'Do you pick the highlights, or let a tool pick them?',
    $body$This is a starter question from the PickMyAgent team, not a member review.

For a Twitch or YouTube stream, do you mark the moments yourself, or do you let a clip tool choose? What did you wish it understood?$body$,
    '2026-10-16T21:03:00Z',
    '2026-10-16T21:03:00Z'
  ),
  (
    'b0000000-0000-4000-8000-000000000005',
    'new-releases',
    'a0000000-0000-4000-8000-000000000001',
    'Which new AI release is worth a look this month?',
    $body$This is a starter question from the PickMyAgent team, not a member review.

If you tried something new recently, what job was it supposed to do, and did it do that job?$body$,
    '2026-10-16T21:04:00Z',
    '2026-10-16T21:04:00Z'
  )
on conflict (id) do nothing;
