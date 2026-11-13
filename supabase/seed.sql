-- Current portfolio content. Safe to re-run: it replaces these rows.
-- It does not add an admin. Do that after the first GitHub sign-in.

insert into public.profile (id, headline, tagline, about, degree, experience)
values (
    1,
    'Admin, IT support, and Power BI',
    'Data analytics, web and app development, content creation, and AI, including image and video generation and AI used with Power BI.',
    E'Kathleah has a BS in Information Systems. Her work spans admin, IT support, Power BI development and analysis, data analytics, web and app development, content creation, and AI.\n\nThat includes AI image generation, AI video generation, and AI used with Power BI. Web and app development sits alongside the data and content work.',
    'BS in Information Systems',
    'Admin, IT support, Power BI development and analysis, data analytics, web and app development, content creation, and AI'
)
on conflict (id) do update set
    headline = excluded.headline,
    tagline = excluded.tagline,
    about = excluded.about,
    degree = excluded.degree,
    experience = excluded.experience,
    updated_at = now();

delete from public.skill_groups;
insert into public.skill_groups (title, items, sort_order, published) values
    ('Admin and IT support', array['Admin', 'IT support'], 1, true),
    ('Power BI and data', array['Power BI development', 'Power BI analysis', 'Data analytics', 'AI integrated with Power BI'], 2, true),
    ('Artificial intelligence', array['AI image generation', 'AI video generation', 'AI integrated with Power BI'], 3, true),
    ('Content', array['Social media content creation'], 4, true),
    ('Web and app development', array['HTML, CSS, and JavaScript', 'App work in Dart and JavaScript', 'TODO: confirm whether the Dart app uses Flutter'], 5, true);

insert into public.contact (id, email, whatsapp, linkedin, pinterest, instagram, facebook, x, github, resume)
values (
    1,
    'TODO: add Gmail address',
    'TODO: add WhatsApp number',
    'TODO: add LinkedIn URL',
    'TODO: add Pinterest URL',
    'TODO: add Instagram URL',
    'TODO: add Facebook URL',
    'TODO: add X URL',
    'https://github.com/Kathleah17',
    'TODO: add resume.pdf at the site root and link it here'
)
on conflict (id) do update set
    email = excluded.email,
    whatsapp = excluded.whatsapp,
    linkedin = excluded.linkedin,
    pinterest = excluded.pinterest,
    instagram = excluded.instagram,
    facebook = excluded.facebook,
    x = excluded.x,
    github = excluded.github,
    resume = excluded.resume,
    updated_at = now();

insert into public.projects (
    id, title, category, kicker, summary, description, experience, tech, tech_note,
    thumbnail, empty_label, image_width, image_height, page, placeholder, live_url, report_url, sort_order, published
) values
    ('izaks', 'Izak’s Homemade Treats', 'development', 'Web & App Development',
     'A storefront screen with Home, Product, Cart, and Profile.', '',
     'TODO: add experience on this project', array[]::text[], 'TODO: add tech stack',
     'Assets/img/izaks.jpg', '', 1400, 788, 'project-izaks.html', false, '', '', 1, true),
    ('etransit', 'Etransit', 'development', 'Web & App Development',
     'A sign-in screen with the line “Seamless Journeys, One Scan Away!”', '',
     'TODO: add experience on this project', array[]::text[], 'TODO: add tech stack',
     'Assets/img/etransit.jpg', '', 1016, 551, 'project-etransit.html', false, '', '', 2, true),
    ('gojobfair', 'GoJobFair App', 'development', 'Web & App Development',
     'TODO: describe the GoJobFair app.',
     'TODO: describe the GoJobFair app. Do not add features that are not documented.',
     'TODO: add experience on GoJobFair', array['Dart', 'JavaScript'],
     'TODO: confirm whether the Dart work is Flutter',
     '', 'TODO: add GoJobFair screenshot', null, null, 'project-gojobfair.html', true,
     'TODO: add GoJobFair link', '', 3, true),
    ('power-bi', 'TODO: Power BI dashboard title', 'pbi', 'PBI Development',
     'TODO: describe a Power BI report or analytics piece you can show.',
     'TODO: describe what the report shows. Leave out numbers you cannot share.',
     'TODO: add experience on this Power BI piece', array['Power BI'], '',
     '', 'TODO: add Power BI dashboard screenshot', null, null, 'project-power-bi.html', true,
     '', 'TODO: add Power BI report URL', 4, true),
    ('content', 'TODO: social content title', 'other', 'Content',
     'TODO: describe a social media content piece.', '',
     'TODO: add experience on this content piece', array[]::text[], '',
     '', 'TODO: add social content sample', null, null, 'project-content.html', true, '', '', 5, true),
    ('ai-media', 'TODO: AI image or video title', 'other', 'AI',
     'TODO: describe an AI image, video, or an AI plus Power BI example.', '',
     'TODO: add experience on this AI piece', array[]::text[], '',
     '', 'TODO: add AI image or video sample', null, null, 'project-ai.html', true, '', '', 6, true)
on conflict (id) do update set
    title = excluded.title,
    category = excluded.category,
    kicker = excluded.kicker,
    summary = excluded.summary,
    description = excluded.description,
    experience = excluded.experience,
    tech = excluded.tech,
    tech_note = excluded.tech_note,
    thumbnail = excluded.thumbnail,
    empty_label = excluded.empty_label,
    image_width = excluded.image_width,
    image_height = excluded.image_height,
    page = excluded.page,
    placeholder = excluded.placeholder,
    live_url = excluded.live_url,
    report_url = excluded.report_url,
    sort_order = excluded.sort_order,
    published = excluded.published,
    updated_at = now();

delete from public.project_resources where project_id = 'power-bi';
insert into public.project_resources (project_id, type, label, url, sort_order) values
    ('power-bi', 'data', 'Data', 'TODO: add dataset file', 1),
    ('power-bi', 'excel', 'Excel', 'TODO: add Excel file', 2),
    ('power-bi', 'pdf', 'Docs PDF', 'TODO: add documentation PDF', 3);
