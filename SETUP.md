# Supabase setup

The public site works without a successful Supabase response. The project URL and anon key are already in `js/supabase-config.js`. If that request fails, the site keeps using `js/contact.js`, `js/projects.js`, and `js/site-data.js`.

Use the anon key only. Do not put a service role key in the repository.

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com).
2. In Project Settings, then API, copy the project URL and the `anon` `public` key.

## 2. Run the SQL

1. Open the SQL editor.
2. Paste and run `supabase/schema.sql`.
3. Paste and run `supabase/seed.sql`.

`schema.sql` creates the tables, turns on row level security, and creates the public `portfolio` storage bucket. Visitors can read published rows and files. Insert, update, and delete are allowed only when `public.admins` contains that signed-in user. Signing in with GitHub is not enough on its own.

## 3. GitHub sign-in

1. In Supabase, open Authentication, then Providers, then GitHub, and turn it on.
2. Create a GitHub OAuth app at [github.com/settings/developers](https://github.com/settings/developers).
3. Set the GitHub OAuth app authorization callback URL to `https://guvthasbpooysrjkzigw.supabase.co/auth/v1/callback`.
4. Paste the GitHub client id and client secret into the Supabase GitHub provider.
5. In Authentication, then URL configuration, set the site URL to `https://kathleah17.github.io/Kathleah_portfolio-2026`.
6. Add these redirect URLs:
   - `https://kathleah17.github.io/Kathleah_portfolio-2026/admin.html`
   - `http://127.0.0.1:8765/admin.html` if you want to sign in from a local preview

## 4. Add yourself as the only editor

1. Open `admin.html` and sign in with GitHub.
2. The page shows your user id because you are not on the allowlist yet.
3. In the Supabase SQL editor, run this with that id and your GitHub login:

```sql
insert into public.admins (user_id, github_login)
values ('PASTE-USER-ID', 'Kathleah17');
```

4. Sign out and sign in again. The editor opens only for that user.

Anyone else who signs in with GitHub sees the allowlist message and cannot write rows or upload files.

## 5. Public key

`js/supabase-config.js` already has the project URL `https://guvthasbpooysrjkzigw.supabase.co` and the anon key. Do not replace that with a service role key.

After a refresh, the home page, projects page, and Power BI file list read published rows from Supabase. If the request fails, they fall back to the static files.

## What to edit later

- Contact links and the hiring email address: the Contact form in `admin.html`, or `js/contact.js` before Supabase is connected.
- Projects, tech stack, and Power BI files: the Projects form. Uploads go to the `portfolio` bucket and the public URL is stored on the row.
- A chip is hidden when its URL is empty. A value that starts with `TODO:` stays visible as a placeholder.
