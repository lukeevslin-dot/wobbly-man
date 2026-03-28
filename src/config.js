// ── Global leaderboard (Supabase) ────────────────────────────────────────────
//
//  To enable the live leaderboard:
//  1. Create a free project at https://supabase.com
//  2. Open the SQL editor and run:
//
//       create table scores (
//         id         bigserial primary key,
//         name       text not null,
//         score      integer not null,
//         created_at timestamptz default now()
//       );
//       alter table scores enable row level security;
//       create policy "public insert" on scores for insert with check (true);
//       create policy "public select" on scores for select using (true);
//
//  3. Go to Project Settings → API, then paste your values below:

export const SUPABASE_URL      = '';   // e.g. 'https://abcxyz.supabase.co'
export const SUPABASE_ANON_KEY = '';   // "anon / public" key
