-- Admin dashboard: inquiries inbox and expertise essays.
-- Apply this in the Supabase SQL editor. It is not applied by the site.
-- Uses the existing public.is_admin() function from schema.sql.

create table if not exists public.inquiries (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    company text,
    role text,
    message text not null,
    read boolean not null default false,
    created_at timestamptz not null default now(),
    constraint inquiries_name_len check (char_length(name) between 1 and 120),
    constraint inquiries_email_len check (char_length(email) between 3 and 200 and position('@' in email) > 1),
    constraint inquiries_company_len check (company is null or char_length(company) <= 160),
    constraint inquiries_role_len check (role is null or char_length(role) <= 160),
    constraint inquiries_message_len check (char_length(message) between 1 and 4000)
);

create table if not exists public.expertise (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    intro text,
    body text,
    highlights text[] not null default '{}',
    image_url text,
    sort_order integer not null default 0,
    published boolean not null default true,
    updated_at timestamptz not null default now()
);

alter table public.inquiries enable row level security;
alter table public.expertise enable row level security;

drop policy if exists "anyone insert inquiries" on public.inquiries;
create policy "anyone insert inquiries"
    on public.inquiries
    for insert
    to anon, authenticated
    with check (
        char_length(name) between 1 and 120
        and char_length(email) between 3 and 200
        and position('@' in email) > 1
        and (company is null or char_length(company) <= 160)
        and (role is null or char_length(role) <= 160)
        and char_length(message) between 1 and 4000
    );

drop policy if exists "admin read inquiries" on public.inquiries;
create policy "admin read inquiries"
    on public.inquiries
    for select
    to authenticated
    using (public.is_admin());

drop policy if exists "admin update inquiries" on public.inquiries;
create policy "admin update inquiries"
    on public.inquiries
    for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "admin delete inquiries" on public.inquiries;
create policy "admin delete inquiries"
    on public.inquiries
    for delete
    to authenticated
    using (public.is_admin());

drop policy if exists "public read expertise" on public.expertise;
create policy "public read expertise"
    on public.expertise
    for select
    to anon, authenticated
    using (published = true or public.is_admin());

drop policy if exists "admin write expertise" on public.expertise;
create policy "admin write expertise"
    on public.expertise
    for all
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

grant select, insert, update, delete on public.inquiries to authenticated;
grant insert on public.inquiries to anon;
grant select, insert, update, delete on public.expertise to authenticated;
grant select on public.expertise to anon;

insert into public.expertise (slug, title, intro, body, highlights, sort_order, published)
values
    ('web-app', 'Web & App Development',
     'TODO: add an introduction to web and app development.',
     'TODO: write about websites and apps. Known so far: HTML, CSS, JavaScript, and Dart. TODO: confirm whether the Dart work is Flutter.',
     array['HTML, CSS, and JavaScript', 'Dart and JavaScript apps', 'TODO: add a highlight you want public'],
     1, true),
    ('power-bi', 'Power BI & Data Analytics',
     'TODO: add an introduction to Power BI development and analysis.',
     'TODO: describe the kind of Power BI reports you build and how analysis fits that work. Leave out numbers you cannot share.',
     array['Power BI development', 'Power BI analysis', 'TODO: add a highlight you want public'],
     2, true),
    ('data-analytics', 'Data Analytics',
     'TODO: add an introduction to data analytics.',
     'TODO: describe how you approach analysis, separate from a specific employer or metric.',
     array['Data analytics', 'TODO: add a highlight you want public'],
     3, true),
    ('social-content', 'Social Media Content',
     'TODO: add an introduction to social media content creation.',
     'TODO: describe the content you make. Name a channel only if you want it public.',
     array['Social media content creation', 'TODO: add a highlight you want public'],
     4, true),
    ('ai', 'AI Image, Video, and AI with Power BI',
     'TODO: add an introduction to AI image generation, AI video generation, and AI used with Power BI.',
     'TODO: describe how you use those tools. Name a product only if you want it public.',
     array['AI image generation', 'AI video generation', 'AI integrated with Power BI'],
     5, true),
    ('it-admin', 'IT Support and Admin',
     'TODO: add an introduction to IT support and admin work.',
     'TODO: describe the support and admin work you want visitors to understand.',
     array['IT support', 'Admin', 'TODO: add a highlight you want public'],
     6, true)
on conflict (slug) do nothing;
