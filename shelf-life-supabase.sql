-- Shelf-Life Monitor — Supabase setup
-- วิธีใช้: Supabase → โปรเจกต์ของคุณ → SQL Editor → New query → วางทั้งหมดนี้ → Run
-- หน้าเว็บ (shelf-life.html) อ่าน/เขียนตาราง items ผ่าน anon key โดยตรง

create table if not exists public.items (
  col        text        not null check (col in ('products', 'contacts', 'batches')),
  id         text        not null,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);

alter table public.items enable row level security;

-- ใครเปิดเว็บก็อ่าน/เพิ่ม/แก้/ลบได้ (ตามที่เลือกให้เว็บเปิดสาธารณะ)
drop policy if exists "shelf-life read"   on public.items;
drop policy if exists "shelf-life insert" on public.items;
drop policy if exists "shelf-life update" on public.items;
drop policy if exists "shelf-life delete" on public.items;
create policy "shelf-life read"   on public.items for select using (true);
create policy "shelf-life insert" on public.items for insert with check (true);
create policy "shelf-life update" on public.items for update using (true) with check (true);
create policy "shelf-life delete" on public.items for delete using (true);
