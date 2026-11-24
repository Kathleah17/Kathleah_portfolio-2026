(function () {
    var cfg = window.SUPABASE_CONFIG || {};
    var configured = cfg.url && cfg.anonKey && String(cfg.url).indexOf("TODO") !== 0 && String(cfg.anonKey).indexOf("TODO") !== 0;
    var preview = new URLSearchParams(location.search).get("preview") === "1";
    var client = configured && window.supabase ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;
    var state = { projects: [], resources: [], skills: [], preview: preview || !configured };

    var signedOut = document.getElementById("signed-out");
    var notAdmin = document.getElementById("not-admin");
    var editor = document.getElementById("editor");
    var statusNode = document.getElementById("status");
    var errorNode = document.getElementById("error");

    function show(node, text) {
        if (!text) {
            node.hidden = true;
            node.textContent = "";
            return;
        }
        node.hidden = false;
        node.textContent = text;
    }

    function note(text) { show(statusNode, text); show(errorNode, ""); }
    function fail(text) { show(errorNode, text); }

    document.getElementById("config-note").textContent = configured
        ? "Supabase is configured. Sign in with the GitHub account that will be on the allowlist."
        : "Supabase is not configured yet. Follow SETUP.md, then paste the project URL and anon key into js/supabase-config.js. You can still preview the editor.";

    document.getElementById("theme-toggle").addEventListener("click", function () {
        var dark = document.documentElement.getAttribute("data-theme") === "dark";
        if (dark) document.documentElement.removeAttribute("data-theme");
        else document.documentElement.setAttribute("data-theme", "dark");
        var nowDark = !dark;
        this.setAttribute("aria-pressed", nowDark ? "true" : "false");
        this.setAttribute("aria-label", nowDark ? "Switch to light theme" : "Switch to dark theme");
        this.querySelector(".theme-toggle-text").textContent = nowDark ? "Light" : "Dark";
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta && window.PortfolioTheme && window.PortfolioTheme.chromeColor) {
            meta.setAttribute("content", window.PortfolioTheme.chromeColor(nowDark));
        }
    });

    function formData(form) {
        var data = {};
        new FormData(form).forEach(function (value, key) { data[key] = value; });
        form.querySelectorAll('input[type="checkbox"]').forEach(function (box) {
            data[box.name] = box.checked;
        });
        return data;
    }

    function fill(form, values) {
        Array.prototype.forEach.call(form.elements, function (field) {
            if (!field.name || values[field.name] == null) return;
            if (field.type === "checkbox") field.checked = !!values[field.name];
            else if (field.type !== "file") field.value = values[field.name];
        });
    }

    function staticProjects() {
        return (window.PROJECTS || []).map(function (project) {
            return {
                id: project.id,
                title: project.title,
                category: project.category,
                summary: project.summary || "",
                description: project.description || "",
                experience: project.experience || "",
                tech: (project.tech || []).join(", "),
                tech_note: project.techNote || "",
                thumbnail: project.thumbnail || "",
                live_url: (project.links && project.links.live) || "",
                report_url: project.reportUrl || "",
                page: project.page || "",
                sort_order: project.sortOrder || 0,
                published: true,
                placeholder: !!project.placeholder,
                resources: project.resources || []
            };
        });
    }

    function renderSkills() {
        var root = document.getElementById("skill-editor");
        root.textContent = "";
        state.skills.forEach(function (group, index) {
            var card = document.createElement("div");
            card.className = "skill-edit";
            card.innerHTML = '<label class="field">Group <input data-skill="title"></label><label class="field">Items, one per line <textarea data-skill="items" rows="4"></textarea></label>';
            card.querySelector('[data-skill="title"]').value = group.title || "";
            card.querySelector('[data-skill="items"]').value = (group.items || []).join("\n");
            card.dataset.index = String(index);
            root.appendChild(card);
        });
    }

    function readSkills() {
        return Array.prototype.map.call(document.querySelectorAll(".skill-edit"), function (card, index) {
            return {
                title: card.querySelector('[data-skill="title"]').value.trim(),
                items: card.querySelector('[data-skill="items"]').value.split("\n").map(function (line) { return line.trim(); }).filter(Boolean),
                sort_order: index + 1,
                published: true
            };
        }).filter(function (group) { return group.title; });
    }

    function renderResources(resources) {
        var root = document.getElementById("resource-editor");
        root.textContent = "";
        (resources || []).forEach(function (resource) { addResourceRow(resource); });
    }

    function addResourceRow(resource) {
        var row = document.createElement("div");
        row.className = "resource-edit";
        row.innerHTML = '<label class="field">Type <select data-res="type"><option value="data">Data</option><option value="excel">Excel</option><option value="pdf">Docs PDF</option></select></label><label class="field">Label <input data-res="label"></label><label class="field">URL <input data-res="url"></label><label class="field">Upload file <input data-res="file" type="file"></label><button class="btn btn-ghost" type="button">Remove</button>';
        if (resource) {
            row.querySelector('[data-res="type"]').value = resource.type || "data";
            row.querySelector('[data-res="label"]').value = resource.label || "";
            row.querySelector('[data-res="url"]').value = resource.url || "";
        }
        row.querySelector("button").addEventListener("click", function () { row.remove(); });
        document.getElementById("resource-editor").appendChild(row);
    }

    function readResources() {
        return Array.prototype.map.call(document.querySelectorAll(".resource-edit"), function (row, index) {
            return {
                type: row.querySelector('[data-res="type"]').value,
                label: row.querySelector('[data-res="label"]').value.trim(),
                url: row.querySelector('[data-res="url"]').value.trim(),
                file: row.querySelector('[data-res="file"]').files[0] || null,
                sort_order: index + 1
            };
        }).filter(function (item) { return item.label; });
    }

    function fillPicker() {
        var picker = document.getElementById("project-picker");
        var current = picker.value;
        picker.textContent = "";
        state.projects.forEach(function (project) {
            var option = document.createElement("option");
            option.value = project.id;
            option.textContent = project.title;
            picker.appendChild(option);
        });
        if (current) picker.value = current;
    }

    function showProject(id) {
        var project = state.projects.filter(function (item) { return item.id === id; })[0];
        if (!project) return;
        fill(document.getElementById("project-form"), project);
        renderResources(project.resources || []);
    }

    var libraryFolder = "all";
    var charts = [];

    function showView(name) {
        document.querySelectorAll("[data-view]").forEach(function (view) {
            view.hidden = view.getAttribute("data-view") !== name;
        });
        document.querySelectorAll("[data-nav]").forEach(function (button) {
            button.setAttribute("aria-current", button.getAttribute("data-nav") === name ? "page" : "false");
        });
        if (name === "dashboard") renderDashboard();
        if (name === "projects") renderLibrary();
        if (name === "inquiries") renderInquiries();
        if (name === "expertise") renderExpertiseAdmin();
    }

    function folderName(category) {
        if (category === "pbi") return "PBI Development";
        if (category === "other") return "Other Skills";
        return "Web & App Development";
    }

    function renderDashboard() {
        var published = state.projects.filter(function (project) { return project.published !== false; }).length;
        var drafts = state.projects.length - published;
        var resources = state.projects.reduce(function (sum, project) {
            return sum + (project.resources || []).filter(function (item) { return item.url && String(item.url).indexOf("TODO:") !== 0; }).length;
        }, 0);
        var inquiries = state.inquiries || [];
        var unread = inquiries.filter(function (item) { return !item.read && !item.sample; }).length;
        var grid = document.getElementById("stat-grid");
        var stats = [
            ["Projects", state.projects.length],
            ["Published", published],
            ["Drafts", drafts],
            ["Resource files", resources],
            ["Inquiries", inquiries.filter(function (item) { return !item.sample; }).length],
            ["Unread", unread]
        ];
        grid.textContent = "";
        stats.forEach(function (stat) {
            var card = document.createElement("article");
            card.className = "stat-card";
            var strong = document.createElement("strong");
            strong.textContent = String(stat[1]);
            var label = document.createElement("span");
            label.textContent = stat[0];
            card.appendChild(strong);
            card.appendChild(label);
            grid.appendChild(card);
        });
        drawCharts();
    }

    function drawCharts() {
        charts.forEach(function (chart) { chart.destroy(); });
        charts = [];
        if (!window.Chart) return;
        var counts = { development: 0, pbi: 0, other: 0 };
        state.projects.forEach(function (project) {
            if (counts[project.category] == null) counts[project.category] = 0;
            counts[project.category] += 1;
        });
        var ink = getComputedStyle(document.body).color;
        charts.push(new window.Chart(document.getElementById("chart-categories"), {
            type: "bar",
            data: {
                labels: ["Web & App", "PBI", "Other"],
                datasets: [{ label: "Projects", data: [counts.development || 0, counts.pbi || 0, counts.other || 0], backgroundColor: "#1e4a3a" }]
            },
            options: { plugins: { legend: { labels: { color: ink } } }, scales: { x: { ticks: { color: ink } }, y: { ticks: { color: ink }, beginAtZero: true } } }
        }));
        var days = [];
        var now = new Date();
        for (var i = 13; i >= 0; i -= 1) {
            var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            days.push(day.toISOString().slice(0, 10));
        }
        var series = days.map(function (day) {
            return (state.inquiries || []).filter(function (item) {
                return !item.sample && String(item.created_at || "").slice(0, 10) === day;
            }).length;
        });
        charts.push(new window.Chart(document.getElementById("chart-inquiries"), {
            type: "line",
            data: { labels: days.map(function (day) { return day.slice(5); }), datasets: [{ label: "Inquiries", data: series, borderColor: "#8a6a3b", tension: 0.3 }] },
            options: { plugins: { legend: { labels: { color: ink } } }, scales: { x: { ticks: { color: ink } }, y: { ticks: { color: ink }, beginAtZero: true } } }
        }));
    }

    function renderLibrary() {
        var query = (document.getElementById("library-search").value || "").toLowerCase();
        var grid = document.getElementById("library-grid");
        grid.textContent = "";
        state.projects.filter(function (project) {
            var folderOk = libraryFolder === "all" || project.category === libraryFolder;
            var text = (project.title + " " + (project.summary || "")).toLowerCase();
            return folderOk && text.indexOf(query) !== -1;
        }).forEach(function (project) {
            var card = document.createElement("button");
            card.type = "button";
            card.className = "library-card";
            if (project.thumbnail) {
                var img = document.createElement("img");
                img.src = project.thumbnail;
                img.alt = "";
                card.appendChild(img);
            } else {
                var fallback = document.createElement("div");
                fallback.className = "library-fallback";
                fallback.textContent = "No thumbnail";
                card.appendChild(fallback);
            }
            var title = document.createElement("strong");
            title.textContent = project.title;
            var meta = document.createElement("span");
            meta.textContent = folderName(project.category) + (project.published === false ? " · Draft" : " · Published");
            card.appendChild(title);
            card.appendChild(meta);
            card.addEventListener("click", function () {
                showProject(project.id);
                document.getElementById("project-dialog").showModal();
            });
            grid.appendChild(card);
        });
    }

    function renderInquiries() {
        var note = document.getElementById("inquiries-note");
        var list = document.getElementById("inquiries-list");
        list.textContent = "";
        if (state.inquiriesError) note.textContent = "Inbox is not available yet. Apply supabase/migrations/20261116023000_admin_dashboard.sql. " + state.inquiriesError;
        else if (!(state.inquiries || []).length) note.textContent = "No messages yet.";
        else note.textContent = state.preview ? "The sample below is not stored." : "Messages sent from the public contact form.";
        (state.inquiries || []).forEach(function (item) {
            var card = document.createElement("article");
            card.className = "inbox-card";
            var title = document.createElement("h3");
            title.textContent = item.name + (item.sample ? " (sample)" : "");
            var meta = document.createElement("p");
            meta.textContent = [item.email, item.company, item.role, item.created_at ? String(item.created_at).slice(0, 10) : ""].filter(Boolean).join(" · ");
            var message = document.createElement("p");
            message.textContent = item.message;
            var actions = document.createElement("div");
            actions.className = "hire-actions";
            var toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "btn btn-ghost";
            toggle.setAttribute("aria-pressed", item.read ? "true" : "false");
            toggle.textContent = item.read ? "Mark unread" : "Mark read";
            toggle.addEventListener("click", function () { markInquiry(item, !item.read, toggle); });
            var reply = document.createElement("a");
            reply.className = "btn";
            reply.href = "mailto:" + encodeURIComponent(item.email) + "?subject=" + encodeURIComponent("Re: portfolio inquiry");
            reply.textContent = "Reply by email";
            actions.appendChild(toggle);
            actions.appendChild(reply);
            card.appendChild(title);
            card.appendChild(meta);
            card.appendChild(message);
            card.appendChild(actions);
            list.appendChild(card);
        });
    }

    function markInquiry(item, read, button) {
        item.read = read;
        button.setAttribute("aria-pressed", read ? "true" : "false");
        button.textContent = read ? "Mark unread" : "Mark read";
        if (item.sample || state.preview || !client) return;
        client.from("inquiries").update({ read: read }).eq("id", item.id).then(function (result) {
            if (result.error) fail(result.error.message);
            else renderDashboard();
        });
    }

    function renderExpertiseAdmin() {
        var root = document.getElementById("expertise-editor");
        var note = document.getElementById("expertise-note");
        root.textContent = "";
        if (state.expertiseError) note.textContent = "Expertise editing needs the new table. Apply the migration. " + state.expertiseError;
        else note.textContent = "Public essays. TODO text stays until you replace it.";
        (state.expertise || window.EXPERTISE || []).forEach(function (item) {
            var form = document.createElement("form");
            form.className = "skill-edit";
            form.innerHTML = '<label class="field">Slug <input name="slug" required></label><label class="field">Title <input name="title" required></label><label class="field">Intro <textarea name="intro" rows="2"></textarea></label><label class="field">Body <textarea name="body" rows="5"></textarea></label><label class="field">Highlights, one per line <textarea name="highlights" rows="3"></textarea></label><label class="field">Image URL <input name="image_url"></label><label class="field">Sort order <input name="sort_order" type="number"></label><label class="check"><input name="published" type="checkbox"> Published</label><button class="btn" type="submit">Save section</button>';
            form.elements.slug.value = item.slug || "";
            form.elements.title.value = item.title || "";
            form.elements.intro.value = item.intro || "";
            form.elements.body.value = item.body || "";
            form.elements.highlights.value = (item.highlights || []).join("\n");
            form.elements.image_url.value = item.image_url || "";
            form.elements.sort_order.value = item.sort_order || 0;
            form.elements.published.checked = item.published !== false;
            if (state.preview) form.querySelector("button").disabled = true;
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                if (state.preview || !client) return;
                var payload = {
                    slug: form.elements.slug.value.trim(),
                    title: form.elements.title.value.trim(),
                    intro: form.elements.intro.value.trim(),
                    body: form.elements.body.value.trim(),
                    highlights: form.elements.highlights.value.split("\n").map(function (line) { return line.trim(); }).filter(Boolean),
                    image_url: form.elements.image_url.value.trim(),
                    sort_order: Number(form.elements.sort_order.value || 0),
                    published: form.elements.published.checked
                };
                var query = item.id ? client.from("expertise").update(payload).eq("id", item.id) : client.from("expertise").insert(payload);
                query.then(function (result) {
                    if (result.error) fail(result.error.message);
                    else note("Expertise section saved.");
                });
            });
            root.appendChild(form);
        });
    }

    function openEditor() {
        signedOut.hidden = true;
        notAdmin.hidden = true;
        editor.hidden = false;
        document.getElementById("preview-banner").hidden = !state.preview;
        document.getElementById("sign-out").hidden = state.preview;
        fill(document.getElementById("profile-form"), state.profile);
        fill(document.getElementById("contact-form"), state.contact);
        renderSkills();
        fillPicker();
        if (window.PortfolioTheme) {
            window.PortfolioTheme.mount({
                client: state.preview ? null : client,
                preview: state.preview,
                note: note
            });
        }
        showView("dashboard");
        if (state.preview) {
            document.querySelectorAll('#editor button[type="submit"], #project-dialog button[type="submit"], #save-skills, #delete-project, input[type="file"]').forEach(function (control) {
                control.disabled = true;
            });
        }
    }

    function loadStatic() {
        state.profile = {
            headline: window.PROFILE.headline,
            tagline: window.PROFILE.tagline,
            about: (window.PROFILE.about || []).join("\n\n"),
            degree: window.PROFILE.degree,
            experience: window.PROFILE.experience
        };
        state.contact = Object.assign({}, window.CONTACT);
        state.skills = (window.SKILLS || []).map(function (group) { return { title: group.title, items: group.items }; });
        state.projects = staticProjects();
        state.expertise = window.EXPERTISE || [];
        state.inquiries = [{
            id: "preview-sample",
            name: "Preview sample",
            email: "preview@example.com",
            company: "Sample only",
            role: "Not a real inquiry",
            message: "This row is shown so the inbox layout can be reviewed. It is not stored.",
            read: false,
            created_at: new Date().toISOString(),
            sample: true
        }];
        state.preview = true;
        openEditor();
    }

    async function uploadFile(file, folder) {
        var path = folder + "/" + Date.now() + "-" + file.name.replace(/[^\w.\-]+/g, "-");
        var result = await client.storage.from("portfolio").upload(path, file, { upsert: false });
        if (result.error) throw result.error;
        return client.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
    }

    document.getElementById("password-form").addEventListener("submit", function (event) {
        event.preventDefault();
        if (!client) { fail("Add the Supabase URL and anon key in js/supabase-config.js first."); return; }
        var data = formData(event.target);
        client.auth.signInWithPassword({ email: data.email, password: data.password }).then(function (result) {
            if (result.error) fail(result.error.message);
            else enterAdmin(result.data.session);
        });
    });

    document.getElementById("forgot-password").addEventListener("click", function () {
        if (!client) { fail("Supabase is not configured."); return; }
        var email = document.getElementById("password-form").elements.email.value.trim();
        if (!email) { fail("Enter the email address first."); return; }
        client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }).then(function (result) {
            if (result.error) fail(result.error.message);
            else note("If that account exists, a reset link is on its way.");
        });
    });

    document.getElementById("sign-in").addEventListener("click", function () {
        if (!client) {
            fail("Add the Supabase URL and anon key in js/supabase-config.js first.");
            return;
        }
        fail("");
        client.auth.signInWithOAuth({
            provider: "github",
            options: { redirectTo: location.origin + location.pathname }
        }).then(function (result) {
            if (result.error) fail(result.error.message);
        });
    });

    document.getElementById("sign-out").addEventListener("click", function () {
        if (!client) return;
        client.auth.signOut().then(function () { location.href = "admin.html"; });
    });

    document.getElementById("add-skill").addEventListener("click", function () {
        state.skills.push({ title: "", items: [] });
        renderSkills();
    });

    document.getElementById("add-resource").addEventListener("click", function () {
        addResourceRow({ type: "data", label: "Data", url: "" });
    });

    document.getElementById("project-picker").addEventListener("change", function (event) {
        showProject(event.target.value);
    });

    document.querySelectorAll("[data-nav]").forEach(function (button) {
        button.addEventListener("click", function () { showView(button.getAttribute("data-nav")); });
    });
    document.getElementById("library-search").addEventListener("input", renderLibrary);
    document.getElementById("library-filters").addEventListener("click", function (event) {
        var folder = event.target.getAttribute("data-folder");
        if (!folder) return;
        libraryFolder = folder;
        renderLibrary();
    });
    document.getElementById("close-project").addEventListener("click", function () {
        document.getElementById("project-dialog").close();
    });
    document.getElementById("add-expertise").addEventListener("click", function () {
        state.expertise = state.expertise || [];
        state.expertise.push({ slug: "", title: "", intro: "", body: "", highlights: [], image_url: "", sort_order: state.expertise.length + 1, published: false });
        renderExpertiseAdmin();
    });

    document.getElementById("new-project").addEventListener("click", function () {
        var blank = { id: "", title: "", category: "development", summary: "", description: "", experience: "", tech: "", tech_note: "", thumbnail: "", live_url: "", report_url: "", page: "", sort_order: state.projects.length + 1, published: true, placeholder: true, resources: [] };
        fill(document.getElementById("project-form"), blank);
        renderResources([]);
        document.getElementById("project-dialog").showModal();
    });

    document.getElementById("profile-form").addEventListener("submit", function (event) {
        event.preventDefault();
        if (state.preview) return;
        var data = formData(event.target);
        client.from("profile").upsert({
            id: 1,
            headline: data.headline,
            tagline: data.tagline,
            about: data.about,
            degree: data.degree,
            experience: data.experience
        }).then(function (result) {
            if (result.error) fail(result.error.message);
            else note("Profile saved.");
        });
    });

    document.getElementById("contact-form").addEventListener("submit", function (event) {
        event.preventDefault();
        if (state.preview) return;
        var data = formData(event.target);
        data.id = 1;
        client.from("contact").upsert(data).then(function (result) {
            if (result.error) fail(result.error.message);
            else note("Contact saved.");
        });
    });

    document.getElementById("save-skills").addEventListener("click", function () {
        if (state.preview) return;
        var groups = readSkills();
        client.from("skill_groups").delete().gte("sort_order", 0).then(function (deleted) {
            if (deleted.error) { fail(deleted.error.message); return; }
            return client.from("skill_groups").insert(groups);
        }).then(function (result) {
            if (!result) return;
            if (result.error) fail(result.error.message);
            else note("Skills saved.");
        });
    });

    document.getElementById("project-form").addEventListener("submit", function (event) {
        event.preventDefault();
        if (state.preview) return;
        var data = formData(event.target);
        var resources = readResources();
        var thumbnailInput = event.target.elements.thumbnail_file;
        var chain = Promise.resolve(data.thumbnail || "");
        if (thumbnailInput.files[0]) chain = uploadFile(thumbnailInput.files[0], "thumbnails");
        chain.then(function (thumbnail) {
            return Promise.all(resources.map(function (resource) {
                if (!resource.file) return resource;
                return uploadFile(resource.file, "files").then(function (url) {
                    resource.url = url;
                    return resource;
                });
            })).then(function (savedResources) {
                return client.from("projects").upsert({
                    id: data.id,
                    title: data.title,
                    category: data.category,
                    kicker: data.category === "pbi" ? "PBI Development" : data.category === "other" ? "Other Skills" : "Web & App Development",
                    summary: data.summary,
                    description: data.description,
                    experience: data.experience,
                    tech: data.tech ? data.tech.split(",").map(function (item) { return item.trim(); }).filter(Boolean) : [],
                    tech_note: data.tech_note,
                    thumbnail: thumbnail,
                    page: data.page,
                    placeholder: !!data.placeholder,
                    live_url: data.live_url,
                    report_url: data.report_url,
                    sort_order: Number(data.sort_order || 0),
                    published: !!data.published
                }).then(function (saved) {
                    if (saved.error) throw saved.error;
                    return client.from("project_resources").delete().eq("project_id", data.id).then(function (removed) {
                        if (removed.error) throw removed.error;
                        if (!savedResources.length) return null;
                        return client.from("project_resources").insert(savedResources.map(function (resource) {
                            return { project_id: data.id, type: resource.type, label: resource.label, url: resource.url, sort_order: resource.sort_order };
                        }));
                    });
                });
            });
        }).then(function (result) {
            if (result && result.error) fail(result.error.message);
            else {
                note("Project saved.");
                document.getElementById("project-dialog").close();
                renderLibrary();
                renderDashboard();
            }
        }).catch(function (error) {
            fail(error.message || "Could not save the project.");
        });
    });

    document.getElementById("delete-project").addEventListener("click", function () {
        if (state.preview) return;
        var id = document.getElementById("project-form").elements.id.value;
        if (!id) return;
        if (!window.confirm("Delete this project? This cannot be undone.")) return;
        client.from("projects").delete().eq("id", id).then(function (result) {
            if (result.error) fail(result.error.message);
            else {
                note("Project deleted.");
                state.projects = state.projects.filter(function (project) { return project.id !== id; });
                fillPicker();
                if (state.projects[0]) showProject(state.projects[0].id);
            }
        });
    });

    function enterAdmin(session) {
        client.from("admins").select("user_id, github_login").eq("user_id", session.user.id).maybeSingle().then(function (admin) {
            if (admin.error || !admin.data) {
                signedOut.hidden = true;
                notAdmin.hidden = false;
                document.getElementById("user-id").textContent = session.user.id;
                var meta = session.user.user_metadata || {};
                document.getElementById("github-login").textContent = meta.user_name || meta.preferred_username || meta.full_name || "Unknown";
                document.getElementById("sign-out").hidden = false;
                return;
            }
            return Promise.all([
                client.from("profile").select("*").eq("id", 1).maybeSingle(),
                client.from("contact").select("*").eq("id", 1).maybeSingle(),
                client.from("skill_groups").select("*").order("sort_order"),
                client.from("projects").select("*").order("sort_order"),
                client.from("project_resources").select("*").order("sort_order"),
                client.from("inquiries").select("*").order("created_at", { ascending: false }),
                client.from("expertise").select("*").order("sort_order")
            ]).then(function (results) {
                var required = results.slice(0, 5).filter(function (result) { return result.error; })[0];
                if (required) { fail(required.error.message); return; }
                state.inquiriesError = results[5].error ? results[5].error.message : "";
                state.expertiseError = results[6].error ? results[6].error.message : "";
                state.inquiries = results[5].error ? [] : (results[5].data || []);
                state.expertise = results[6].error ? (window.EXPERTISE || []) : (results[6].data || []);
                var profile = results[0].data || {};
                state.preview = false;
                state.profile = profile;
                state.profile.about = profile.about || "";
                state.contact = results[1].data || {};
                state.skills = results[2].data || [];
                var resources = results[4].data || [];
                state.projects = (results[3].data || []).map(function (project) {
                    project.tech = (project.tech || []).join(", ");
                    project.resources = resources.filter(function (item) { return item.project_id === project.id; });
                    return project;
                });
                openEditor();
                note("Signed in.");
            });
        });
    }

    if (preview || !configured) {
        if (preview) loadStatic();
        return;
    }

    client.auth.getSession().then(function (result) {
        if (result.error) { fail(result.error.message); return; }
        if (result.data.session) enterAdmin(result.data.session);
    });
})();
