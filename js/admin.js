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
        this.setAttribute("aria-pressed", dark ? "false" : "true");
        this.querySelector(".theme-toggle-text").textContent = dark ? "Dark" : "Light";
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
        if (state.projects[0]) showProject(state.projects[0].id);
        if (state.preview) {
            editor.querySelectorAll('button[type="submit"], #save-skills, #delete-project, #add-skill, #add-resource, input[type="file"]').forEach(function (control) {
                if (control.id === "add-resource" || control.id === "add-skill") return;
                if (control.type === "file" || control.type === "submit" || control.id === "save-skills" || control.id === "delete-project") control.disabled = true;
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
        state.preview = true;
        openEditor();
    }

    async function uploadFile(file, folder) {
        var path = folder + "/" + Date.now() + "-" + file.name.replace(/[^\w.\-]+/g, "-");
        var result = await client.storage.from("portfolio").upload(path, file, { upsert: false });
        if (result.error) throw result.error;
        return client.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
    }

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

    document.getElementById("new-project").addEventListener("click", function () {
        if (state.preview) return;
        var blank = { id: "", title: "", category: "development", summary: "", description: "", experience: "", tech: "", tech_note: "", thumbnail: "", live_url: "", report_url: "", page: "", sort_order: state.projects.length + 1, published: true, placeholder: true, resources: [] };
        state.projects.unshift(blank);
        fillPicker();
        document.getElementById("project-picker").value = "";
        fill(document.getElementById("project-form"), blank);
        renderResources([]);
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
            else note("Project saved.");
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
                client.from("project_resources").select("*").order("sort_order")
            ]).then(function (results) {
                var problem = results.filter(function (result) { return result.error; })[0];
                if (problem) { fail(problem.error.message); return; }
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
