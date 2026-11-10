-- School portal schema. Apply with `supabase db push` after linking a project.
create extension if not exists pgcrypto;
do $$ begin
  create type public.app_role as enum ('admin', 'teacher', 'student');
exception when duplicate_object then null;
end $$;

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role public.app_role not null,
  full_name text not null,
  class_id uuid references public.classes(id),
  is_blocked boolean not null default false,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_requires_class check (role <> 'student' or class_id is not null)
);

create table if not exists public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 5),
  lesson_number smallint not null check (lesson_number between 1 and 12),
  starts_at time not null,
  ends_at time not null,
  subject text not null,
  room text,
  academic_year text not null,
  unique (class_id, weekday, lesson_number, academic_year)
);

create table if not exists public.teacher_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  storage_path text not null unique,
  uploaded_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid not null references public.profiles(user_id),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_staff (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  job_title text not null,
  work_email text,
  work_phone text,
  published boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(user_id),
  action text not null,
  target_user_id uuid references public.profiles(user_id),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists schedule_entries_class_year_idx on public.schedule_entries(class_id, academic_year);
create index if not exists profiles_class_id_idx on public.profiles(class_id);
create index if not exists news_published_idx on public.news(status, published_at desc);

-- SECURITY DEFINER helpers avoid recursive RLS lookups; fixed search_path is required.
create or replace function public.current_role()
returns public.app_role language sql stable security definer set search_path = ''
as $$ select p.role from public.profiles p
     where p.user_id = (select auth.uid()) and not p.is_blocked
       and not p.must_change_password $$;

create or replace function public.account_is_active()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles p
     where p.user_id = (select auth.uid()) and not p.is_blocked
       and not p.must_change_password) $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(public.current_role() = 'admin', false) $$;

create or replace function public.can_read_class(target_class_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles p
     where p.user_id = (select auth.uid()) and not p.is_blocked
       and not p.must_change_password and
       (p.role in ('admin', 'teacher') or
        (p.role = 'student' and p.class_id = target_class_id))) $$;

revoke all on function public.current_role() from public;
revoke all on function public.account_is_active() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.can_read_class(uuid) from public;
grant execute on function public.current_role() to authenticated;
grant execute on function public.account_is_active() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_read_class(uuid) to authenticated;

alter table public.classes enable row level security;
alter table public.profiles enable row level security;
alter table public.schedule_entries enable row level security;
alter table public.teacher_materials enable row level security;
alter table public.news enable row level security;
alter table public.public_staff enable row level security;
alter table public.audit_log enable row level security;

grant select on public.classes, public.profiles, public.schedule_entries,
  public.teacher_materials, public.news, public.public_staff to anon, authenticated;
grant insert, update, delete on public.classes, public.profiles,
  public.schedule_entries, public.teacher_materials, public.news,
  public.public_staff to authenticated;
-- No table privileges/policies for direct client writes to audit_log.

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists classes_read_active on public.classes;
create policy classes_read_active on public.classes for select to authenticated
  using ((select public.account_is_active()));
drop policy if exists classes_admin_manage on public.classes;
create policy classes_admin_manage on public.classes for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists schedule_read_permitted_class on public.schedule_entries;
create policy schedule_read_permitted_class on public.schedule_entries for select to authenticated
  using ((select public.account_is_active()) and (select public.can_read_class(class_id)));
drop policy if exists schedule_admin_manage on public.schedule_entries;
create policy schedule_admin_manage on public.schedule_entries for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists materials_teacher_admin_read on public.teacher_materials;
create policy materials_teacher_admin_read on public.teacher_materials for select to authenticated
  using ((select public.account_is_active()) and (select public.current_role()) in ('teacher','admin'));
drop policy if exists materials_admin_manage on public.teacher_materials;
create policy materials_admin_manage on public.teacher_materials for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists news_read_published on public.news;
create policy news_read_published on public.news for select to anon, authenticated
  using (status = 'published' and published_at is not null and published_at <= now());
drop policy if exists news_admin_read_all on public.news;
create policy news_admin_read_all on public.news for select to authenticated
  using ((select public.is_admin()));
drop policy if exists news_admin_manage on public.news;
create policy news_admin_manage on public.news for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists staff_read_published on public.public_staff;
create policy staff_read_published on public.public_staff for select to anon, authenticated
  using (published = true);
drop policy if exists staff_admin_manage on public.public_staff;
create policy staff_admin_manage on public.public_staff for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Direct client writes to protected profile fields are intentionally not exposed.
-- Account lifecycle is performed by Edge Functions after checking the caller's JWT and role.

insert into storage.buckets (id, name, public, file_size_limit)
values ('teacher-materials', 'teacher-materials', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists teacher_material_objects_read on storage.objects;
create policy teacher_material_objects_read on storage.objects for select to authenticated
  using (bucket_id = 'teacher-materials' and (select public.account_is_active())
    and (select public.current_role()) in ('teacher','admin'));
drop policy if exists teacher_material_objects_admin_insert on storage.objects;
create policy teacher_material_objects_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'teacher-materials' and (select public.is_admin()));
drop policy if exists teacher_material_objects_admin_update on storage.objects;
create policy teacher_material_objects_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'teacher-materials' and (select public.is_admin()))
  with check (bucket_id = 'teacher-materials' and (select public.is_admin()));
drop policy if exists teacher_material_objects_admin_delete on storage.objects;
create policy teacher_material_objects_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'teacher-materials' and (select public.is_admin()));
