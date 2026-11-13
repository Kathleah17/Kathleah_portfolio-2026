/* Loads published rows from Supabase when js/supabase-config.js has a URL and anon key.
   On any miss, the static files stay in place. */
window.CONTENT_READY = (function () {
    var cfg = window.SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey || String(cfg.url).indexOf("TODO") === 0 || String(cfg.anonKey).indexOf("TODO") === 0) {
        return Promise.resolve(false);
    }

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    return loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2").then(function () {
        var client = window.supabase.createClient(cfg.url, cfg.anonKey);
        return Promise.all([
            client.from("profile").select("*").eq("id", 1).maybeSingle(),
            client.from("skill_groups").select("*").eq("published", true).order("sort_order"),
            client.from("contact").select("*").eq("id", 1).maybeSingle(),
            client.from("projects").select("*").eq("published", true).order("sort_order"),
            client.from("project_resources").select("*").order("sort_order")
        ]);
    }).then(function (results) {
        var failed = results.some(function (result) { return result.error; });
        if (failed) return false;
        var profile = results[0].data;
        var skills = results[1].data || [];
        var contact = results[2].data;
        var projects = results[3].data || [];
        var resources = results[4].data || [];
        if (!projects.length && !profile && !contact) return false;

        if (profile) {
            window.PROFILE = {
                headline: profile.headline || window.PROFILE.headline,
                tagline: profile.tagline || window.PROFILE.tagline,
                degree: profile.degree || window.PROFILE.degree,
                experience: profile.experience || window.PROFILE.experience,
                about: profile.about ? String(profile.about).split(/\n\n/) : window.PROFILE.about
            };
        }
        if (skills.length) {
            window.SKILLS = skills.map(function (group) {
                return { title: group.title, items: group.items || [] };
            });
        }
        if (contact && window.CONTACT) {
            ["email", "whatsapp", "linkedin", "pinterest", "instagram", "facebook", "x", "github", "resume"].forEach(function (key) {
                if (contact[key]) window.CONTACT[key] = contact[key];
            });
        }
        if (projects.length && window.PROJECTS) {
            window.PROJECTS = projects.map(function (project) {
                return {
                    id: project.id,
                    title: project.title,
                    category: project.category,
                    kicker: project.kicker,
                    summary: project.summary,
                    description: project.description || "",
                    experience: project.experience || "",
                    tech: project.tech || [],
                    techNote: project.tech_note || "",
                    thumbnail: project.thumbnail || "",
                    emptyLabel: project.empty_label || "",
                    width: project.image_width || 800,
                    height: project.image_height || 450,
                    page: project.page,
                    placeholder: !!project.placeholder,
                    sortOrder: project.sort_order || 0,
                    reportUrl: project.report_url || "",
                    links: { live: project.live_url || "" },
                    resources: resources.filter(function (item) {
                        return item.project_id === project.id;
                    }).map(function (item) {
                        return { type: item.type, label: item.label, url: item.url || "" };
                    })
                };
            });
        }
        return true;
    }).catch(function () {
        return false;
    });
})();
