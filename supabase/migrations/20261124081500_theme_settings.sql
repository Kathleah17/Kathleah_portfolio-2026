-- Theme colors: one row of light and dark palettes.
-- Apply this in the Supabase SQL editor. The site does not apply it.
-- Uses public.is_admin() from schema.sql.

create table if not exists public.theme_settings (
    id integer primary key default 1,
    light jsonb not null,
    dark jsonb not null,
    updated_at timestamptz not null default now(),
    constraint theme_settings_one_row check (id = 1)
);

alter table public.theme_settings enable row level security;

drop policy if exists "public read theme" on public.theme_settings;
create policy "public read theme"
    on public.theme_settings
    for select
    to anon, authenticated
    using (true);

drop policy if exists "admin write theme" on public.theme_settings;
create policy "admin write theme"
    on public.theme_settings
    for all
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

grant select on public.theme_settings to anon, authenticated;
grant insert, update, delete on public.theme_settings to authenticated;

insert into public.theme_settings (id, light, dark)
values (
    1,
    '{"primary":"#1e4a3a","secondary":"#8a6a3b","third":null,"fourth":null}'::jsonb,
    '{"primary":"#8fbfa6","secondary":"#d4b483","third":null,"fourth":null,"bg":"#141311","surface":"#1e1c19","auto":{"primary":true,"secondary":true,"third":true,"fourth":true,"bg":true,"surface":true}}'::jsonb
)
on conflict (id) do nothing;
