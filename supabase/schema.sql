-- Portfolio schema for Supabase.
-- Run this in the SQL editor. It does not include a service role key.
-- After Kathleah signs in once, add her auth user id to public.admins
-- from the SQL editor. The API cannot create the first admin.

create extension if not exists pgcrypto;

create table if not exists public.admins (
    user_id uuid primary key references auth.users (id) on delete cascade,
    github_login text,
    created_at timestamptz not null default now()
);

create table if not exists public.profile (
    id integer primary key default 1 check (id = 1),
    headline text not null,
    tagline text not null,
    about text not null,
    degree text not null,
    experience text not null,
    updated_at timestamptz not null default now()
);

create table if not exists public.skill_groups (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    items text[] not null default '{}',
    sort_order integer not null default 0,
    published boolean not null default true
);

create table if not exists public.contact (
    id integer primary key default 1 check (id = 1),
    email text,
    whatsapp text,
    linkedin text,
    pinterest text,
    instagram text,
    facebook text,
    x text,
    github text,
    resume text,
    updated_at timestamptz not null default now()
);

create table if not exists public.projects (
    id text primary key,
    title text not null,
    category text not null check (category in ('development', 'pbi', 'other')),
    kicker text,
    summary text,
    description text,
    experience text,
    tech text[] not null default '{}',
    tech_note text,
    thumbnail text,
    empty_label text,
    image_width integer,
    image_height integer,
    page text,
    placeholder boolean not null default false,
    live_url text,
    report_url text,
    sort_order integer not null default 0,
    published boolean not null default true,
    updated_at timestamptz not null default now()
);

create table if not exists public.project_resources (
    id uuid primary key default gen_random_uuid(),
    project_id text not null references public.projects (id) on delete cascade,
    type text not null check (type in ('data', 'excel', 'pdf')),
    label text not null,
    url text,
    sort_order integer not null default 0
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.admins where user_id = auth.uid()
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.admins enable row level security;
alter table public.profile enable row level security;
alter table public.skill_groups enable row level security;
alter table public.contact enable row level security;
alter table public.projects enable row level security;
alter table public.project_resources enable row level security;

drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins
    for select to authenticated
    using (user_id = auth.uid());

drop policy if exists "public read profile" on public.profile;
create policy "public read profile" on public.profile
    for select to anon, authenticated
    using (true);

drop policy if exists "admin write profile" on public.profile;
create policy "admin write profile" on public.profile
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "public read skills" on public.skill_groups;
create policy "public read skills" on public.skill_groups
    for select to anon, authenticated
    using (published = true or public.is_admin());

drop policy if exists "admin write skills" on public.skill_groups;
create policy "admin write skills" on public.skill_groups
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "public read contact" on public.contact;
create policy "public read contact" on public.contact
    for select to anon, authenticated
    using (true);

drop policy if exists "admin write contact" on public.contact;
create policy "admin write contact" on public.contact
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "public read projects" on public.projects;
create policy "public read projects" on public.projects
    for select to anon, authenticated
    using (published = true or public.is_admin());

drop policy if exists "admin write projects" on public.projects;
create policy "admin write projects" on public.projects
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "public read resources" on public.project_resources;
create policy "public read resources" on public.project_resources
    for select to anon, authenticated
    using (
        public.is_admin()
        or exists (
            select 1 from public.projects
            where projects.id = project_resources.project_id
              and projects.published = true
        )
    );

drop policy if exists "admin write resources" on public.project_resources;
create policy "admin write resources" on public.project_resources
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.profile, public.skill_groups, public.contact, public.projects, public.project_resources to anon;
grant select, insert, update, delete on public.profile, public.skill_groups, public.contact, public.projects, public.project_resources to authenticated;
grant select on public.admins to authenticated;

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "portfolio public read" on storage.objects;
create policy "portfolio public read" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'portfolio');

drop policy if exists "portfolio admin insert" on storage.objects;
create policy "portfolio admin insert" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists "portfolio admin update" on storage.objects;
create policy "portfolio admin update" on storage.objects
    for update to authenticated
    using (bucket_id = 'portfolio' and public.is_admin())
    with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists "portfolio admin delete" on storage.objects;
create policy "portfolio admin delete" on storage.objects
    for delete to authenticated
    using (bucket_id = 'portfolio' and public.is_admin());
