(function () {
    var root = document.documentElement;
    var themeBtn = document.querySelector(".theme-toggle");
    var themeText = themeBtn ? themeBtn.querySelector(".theme-toggle-text") : null;
    var menuBtn = document.querySelector(".menu-toggle");
    var nav = document.getElementById("site-nav");
    var menuLabel = menuBtn ? menuBtn.querySelector(".menu-label") : null;

    function applyTheme(theme) {
        var dark = theme === "dark";
        if (dark) root.setAttribute("data-theme", "dark");
        else root.removeAttribute("data-theme");

        if (themeBtn) {
            themeBtn.setAttribute("aria-pressed", dark ? "true" : "false");
            themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
        }
        if (themeText) themeText.textContent = dark ? "Light" : "Dark";

        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", dark ? "#141311" : "#f3efe7");
    }

    applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

    if (themeBtn) {
        themeBtn.addEventListener("click", function () {
            var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
            try {
                localStorage.setItem("theme", next);
            } catch (err) {
                /* Storage can be blocked. The toggle still works for this visit. */
            }
            applyTheme(next);
        });
    }

    function setMenu(open) {
        if (!menuBtn || !nav) return;
        nav.classList.toggle("is-open", open);
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
        if (menuLabel) menuLabel.textContent = open ? "Close" : "Menu";
    }

    if (menuBtn && nav) {
        menuBtn.addEventListener("click", function () {
            setMenu(!nav.classList.contains("is-open"));
        });

        nav.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                setMenu(false);
            });
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && nav.classList.contains("is-open")) {
                setMenu(false);
                menuBtn.focus();
            }
        });

        var desktop = window.matchMedia("(min-width: 900px)");
        var closeOnDesktop = function () {
            if (desktop.matches) setMenu(false);
        };
        if (desktop.addEventListener) desktop.addEventListener("change", closeOnDesktop);
        else if (desktop.addListener) desktop.addListener(closeOnDesktop);
    }

    document.querySelectorAll(".folder-browser").forEach(function (browser) {
        var tabs = Array.prototype.slice.call(browser.querySelectorAll('[role="tab"]'));
        var motion = window.matchMedia("(prefers-reduced-motion: reduce)");

        function panelFor(tab) {
            var id = tab.getAttribute("aria-controls");
            return id ? document.getElementById(id) : null;
        }

        function select(next, moveFocus) {
            var current = null;
            tabs.forEach(function (tab) {
                if (tab.getAttribute("aria-selected") === "true") current = tab;
            });
            if (!next || next === current) {
                if (moveFocus && next) next.focus();
                return;
            }

            var currentPanel = current ? panelFor(current) : null;
            var nextPanel = panelFor(next);

            function apply() {
                tabs.forEach(function (tab) {
                    var on = tab === next;
                    tab.setAttribute("aria-selected", on ? "true" : "false");
                    tab.tabIndex = on ? 0 : -1;
                    var panel = panelFor(tab);
                    if (!panel) return;
                    panel.hidden = !on;
                });
                if (moveFocus) next.focus();
            }

            if (!currentPanel || !nextPanel || motion.matches) {
                apply();
                return;
            }

            var finished = false;
            function finish() {
                if (finished) return;
                finished = true;
                currentPanel.classList.remove("is-leaving");
                nextPanel.classList.add("is-entering");
                apply();
                window.requestAnimationFrame(function () {
                    window.requestAnimationFrame(function () {
                        nextPanel.classList.remove("is-entering");
                    });
                });
            }

            currentPanel.classList.add("is-leaving");
            currentPanel.addEventListener("transitionend", function (event) {
                if (event.propertyName === "opacity") finish();
            });
            window.setTimeout(finish, 280);
        }

        tabs.forEach(function (tab, index) {
            tab.addEventListener("click", function () {
                select(tab, false);
            });
            tab.addEventListener("keydown", function (event) {
                var key = event.key;
                var delta = 0;
                if (key === "ArrowRight" || key === "ArrowDown") delta = 1;
                else if (key === "ArrowLeft" || key === "ArrowUp") delta = -1;
                else if (key === "Home") {
                    event.preventDefault();
                    select(tabs[0], true);
                    return;
                } else if (key === "End") {
                    event.preventDefault();
                    select(tabs[tabs.length - 1], true);
                    return;
                }
                if (!delta) return;
                event.preventDefault();
                select(tabs[(index + delta + tabs.length) % tabs.length], true);
            });
        });
    });

    var ICONS = {
        mail: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M4 7h16v10H4V7zm0 .5 8 6 8-6"/></svg>',
        whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3.2A8.7 8.7 0 0 0 4.6 16.3L3.5 20.5l4.3-1.1A8.7 8.7 0 1 0 12 3.2zm4.6 12.2c-.2.6-1.1 1-1.6 1.1-.4 0-.9.2-3-.8-2.5-1-4-3.4-4.1-3.6-.2-.2-1.2-1.6-1.2-3s.8-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5.2.5.7 1.9.8 2 .1.2.1.3 0 .5-.1.2-.2.4-.4.6l-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.2 1.6 1.9 1.1.8 1.9 1.1 2.2 1.2.3.1.5.1.6-.1l.6-.8c.2-.2.4-.2.6-.1.3.1 1.6.8 1.8.9.2.1.4.2.5.3.1.3-.1.9-.3 1.4z"/></svg>',
        linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.5 9H4v11h2.5V9zM5.2 3.8a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM20 20h-2.5v-5.6c0-1.6-.6-2.6-1.9-2.6-1 0-1.5.7-1.8 1.3-.1.2-.1.6-.1.9V20H11V9h2.4v1.5A3.2 3.2 0 0 1 16.6 9c2.3 0 3.4 1.5 3.4 4.7V20z"/></svg>',
        pinterest: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3.2A8.8 8.8 0 0 0 8.4 20c-.1-.7-.2-1.8 0-2.6l1.5-6.2s-.4-.7-.4-1.8c0-1.7 1-3 2.2-3 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.6-2.7 3.6-6 0-2.5-1.7-4.3-4.8-4.3A5 5 0 0 0 7 9.4c0 1.1.3 1.8.9 2.4.2.2.2.3.1.6l-.3 1c-.1.2-.2.3-.4.2-1.3-.5-1.9-2-1.9-3.6 0-2.7 2.3-5.9 6.8-5.9 3.6 0 6 2.6 6 5.4 0 3.7-2 6.4-5 6.4-1 0-1.9-.5-2.2-1.1l-.6 2.3c-.2.8-.7 1.6-1.1 2.2A8.8 8.8 0 1 0 12 3.2z"/></svg>',
        instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M8 4.5h8A3.5 3.5 0 0 1 19.5 8v8a3.5 3.5 0 0 1-3.5 3.5H8A3.5 3.5 0 0 1 4.5 16V8A3.5 3.5 0 0 1 8 4.5z"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16.7" cy="7.4" r="0.9" fill="currentColor"/></svg>',
        facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14.2 20v-6.2h2.1l.3-2.4h-2.4V9.8c0-.7.2-1.2 1.2-1.2h1.3V6.5c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.1-3.2 3.3v1.8H9.3v2.4h2.3V20h2.6z"/></svg>',
        x: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14.7 4h2.6l-5.7 6.5L18.5 20h-4.3l-3.4-4.4L7 20H4.4l6.1-7L4.2 4h4.4l3 4L14.7 4zm-.9 14.4h1.4L8.3 5.5H6.8l7 12.9z"/></svg>',
        github: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3.2a8.8 8.8 0 0 0-2.8 17.1c.4.1.6-.2.6-.4v-1.4c-2.5.5-3-1.1-3-1.1-.4-.9-.9-1.2-.9-1.2-.8-.5.1-.5.1-.5.8.1 1.3.9 1.3.9.7 1.3 1.9.9 2.4.7.1-.5.3-.9.5-1.1-2-.2-4-1-4-4.4 0-1 .3-1.8.9-2.4-.1-.2-.4-1.2.1-2.4 0 0 .8-.3 2.5.9a8.6 8.6 0 0 1 4.6 0c1.7-1.2 2.5-.9 2.5-.9.5 1.2.2 2.2.1 2.4.6.6.9 1.4.9 2.4 0 3.4-2.1 4.2-4.1 4.4.3.3.6.8.6 1.6v2.4c0 .2.2.5.6.4A8.8 8.8 0 0 0 12 3.2z"/></svg>',
        data: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M5 7.5c0-1.4 3.1-2.5 7-2.5s7 1.1 7 2.5-3.1 2.5-7 2.5-7-1.1-7-2.5zm0 0V12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V7.5M5 12v4.5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V12"/></svg>',
        excel: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M8 4.5h8.5L20 8v11.5H8V4.5z"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="M16.5 4.5V8H20M5 9.5l3.2 5L5 19.5M10.2 9.5 7 14.5l3.2 5"/></svg>',
        pdf: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M8 3.5h6.5L19 8v12.5H8V3.5z"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="M14.5 3.5V8H19M9.5 13.5h2a1.2 1.2 0 0 1 0 2.4h-2V18M14 13.5v4.5M14 15.5h1.6M17.2 13.5h1.5a1 1 0 0 1 0 2h-1.5"/></svg>'
    };

    function icon(name) {
        var holder = document.createElement("span");
        holder.className = "icon";
        holder.innerHTML = ICONS[name] || ICONS.pdf;
        return holder;
    }

    function isPlaceholder(value) {
        return !value || String(value).indexOf("TODO:") === 0;
    }

    function wireExternal(anchor, href, label, todoText) {
        anchor.classList.remove("is-todo");
        var status = anchor.querySelector(".link-status");
        if (isPlaceholder(href)) {
            anchor.href = "#contact";
            anchor.removeAttribute("target");
            anchor.removeAttribute("rel");
            anchor.classList.add("is-todo");
            anchor.setAttribute("aria-disabled", "true");
            anchor.setAttribute("aria-label", label + ". " + href);
            if (status) status.hidden = false;
            return;
        }
        anchor.href = href;
        anchor.target = "_blank";
        anchor.rel = "noopener";
        anchor.removeAttribute("aria-disabled");
        anchor.setAttribute("aria-label", label + " (opens in a new tab)");
        if (status) status.hidden = true;
        if (todoText) anchor.removeAttribute("title");
    }

    function renderDynamic() {
    document.querySelectorAll("[data-icon]").forEach(function (slot) {
        var name = slot.getAttribute("data-icon");
        if (ICONS[name]) slot.innerHTML = ICONS[name];
    });

    if (window.CONTACT) {
        var contact = window.CONTACT;
        document.querySelectorAll("[data-contact]").forEach(function (anchor) {
            var key = anchor.getAttribute("data-contact");
            var value = contact[key] || "";
            var label = anchor.getAttribute("data-label") || key;
            var href = value;
            if (!isPlaceholder(value)) {
                if (key === "email") {
                    href = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(value);
                } else if (key === "whatsapp") {
                    href = "https://wa.me/" + String(value).replace(/\D/g, "");
                }
            }
            wireExternal(anchor, href, label, true);
            if (!anchor.dataset.bound) {
                anchor.dataset.bound = "1";
                anchor.addEventListener("click", function (event) {
                    if (anchor.getAttribute("aria-disabled") === "true") event.preventDefault();
                });
            }
        });

        var hiring = document.getElementById("hiring-inquiry");
        if (hiring) {
            var hiringLabel = "Hiring? Send an inquiry";
            if (isPlaceholder(contact.email)) {
                wireExternal(hiring, contact.email, hiringLabel, true);
                if (!hiring.dataset.bound) {
                    hiring.dataset.bound = "1";
                    hiring.addEventListener("click", function (event) {
                        if (hiring.getAttribute("aria-disabled") === "true") event.preventDefault();
                    });
                }
            } else {
                var subject = "[Hiring Inquiry] <Company> – <Role>";
                var body = "Name:\nCompany:\nRole:\nPreferred meeting times:\n";
                hiring.href = "mailto:" + contact.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
                hiring.removeAttribute("target");
                hiring.removeAttribute("rel");
                hiring.classList.remove("is-todo");
                hiring.removeAttribute("aria-disabled");
                hiring.setAttribute("aria-label", hiringLabel);
                var hiringStatus = hiring.querySelector(".link-status");
                if (hiringStatus) hiringStatus.hidden = true;
            }
        }

        var todoList = document.getElementById("contact-todo-list");
        if (todoList) {
            Object.keys(contact).forEach(function (key) {
                if (!isPlaceholder(contact[key])) return;
                var item = document.createElement("li");
                item.textContent = contact[key];
                todoList.appendChild(item);
            });
            var todoTitle = document.getElementById("contact-todo-title");
            if (todoTitle && !todoList.children.length) todoTitle.hidden = true;
        }
    }

    function resourceChip(resource) {
        if (!resource || !resource.url) return null;
        var real = !isPlaceholder(resource.url);
        var node = document.createElement(real ? "a" : "span");
        node.className = "chip" + (real ? "" : " is-todo");
        node.appendChild(icon(resource.type));
        node.appendChild(document.createTextNode(resource.label));
        if (real) {
            node.href = resource.url;
            node.target = "_blank";
            node.rel = "noopener";
            node.setAttribute("aria-label", resource.label + " (opens in a new tab)");
        } else {
            var flag = document.createElement("span");
            flag.className = "link-status";
            flag.textContent = "To add";
            node.appendChild(flag);
            node.setAttribute("role", "note");
            node.setAttribute("aria-label", resource.label + ". " + resource.url);
        }
        return node;
    }

    function fillResourceList(list, project) {
        if (!list || !project) return;
        var shown = 0;
        (project.resources || []).forEach(function (resource) {
            if (!resource.url) return;
            shown += 1;
            var item = document.createElement("li");
            if (isPlaceholder(resource.url)) {
                item.textContent = resource.label + ": " + resource.url;
            } else {
                var link = document.createElement("a");
                link.href = resource.url;
                link.target = "_blank";
                link.rel = "noopener";
                link.textContent = resource.label;
                item.appendChild(link);
            }
            list.appendChild(item);
        });
        if (project.reportUrl) {
            shown += 1;
            var report = document.createElement("li");
            if (isPlaceholder(project.reportUrl)) {
                report.textContent = "Report: " + project.reportUrl;
            } else {
                var reportLink = document.createElement("a");
                reportLink.href = project.reportUrl;
                reportLink.target = "_blank";
                reportLink.rel = "noopener";
                reportLink.textContent = "Open report";
                report.appendChild(reportLink);
            }
            list.appendChild(report);
        }
        return shown;
    }

    function projectCard(project, headingTag) {
        var article = document.createElement("article");
        article.className = "project-card" + (project.placeholder ? " is-placeholder" : "");
        article.dataset.category = project.category;

        var link = document.createElement("a");
        link.className = "project-card-link";
        link.href = project.page;

        var media = document.createElement("div");
        media.className = "project-media" + (project.thumbnail ? "" : " is-empty");
        if (project.thumbnail) {
            var img = document.createElement("img");
            img.src = project.thumbnail;
            img.alt = "";
            img.width = project.width || 800;
            img.height = project.height || 450;
            img.loading = "lazy";
            img.decoding = "async";
            media.appendChild(img);
        } else {
            media.setAttribute("aria-hidden", "true");
            var empty = document.createElement("span");
            empty.textContent = project.emptyLabel || "TODO: add image";
            media.appendChild(empty);
        }

        var body = document.createElement("div");
        body.className = "project-body";
        var kicker = document.createElement("p");
        kicker.className = "kicker";
        kicker.textContent = project.kicker;
        body.appendChild(kicker);
        if (project.placeholder) {
            var flag = document.createElement("p");
            flag.className = "flag";
            flag.textContent = "Placeholder";
            body.appendChild(flag);
        }
        var title = document.createElement(headingTag);
        title.textContent = project.title;
        var summary = document.createElement("p");
        summary.textContent = project.summary;
        var tech = document.createElement("ul");
        tech.className = "tech-row";
        (project.tech || []).forEach(function (name) {
            var item = document.createElement("li");
            item.textContent = name;
            tech.appendChild(item);
        });
        if (project.techNote) {
            var note = document.createElement("li");
            note.className = "is-todo";
            note.textContent = project.techNote;
            tech.appendChild(note);
        }
        var action = document.createElement("span");
        action.className = "text-link";
        action.textContent = "View project";
        body.appendChild(title);
        body.appendChild(summary);
        if (tech.children.length) body.appendChild(tech);
        body.appendChild(action);
        link.appendChild(media);
        link.appendChild(body);
        article.appendChild(link);

        var resources = (project.resources || []).map(resourceChip).filter(Boolean);
        if (resources.length) {
            var row = document.createElement("div");
            row.className = "resource-row";
            row.setAttribute("role", "group");
            row.setAttribute("aria-label", "Project files");
            resources.forEach(function (chip) { row.appendChild(chip); });
            article.appendChild(row);
        }
        return article;
    }

    if (window.PROJECTS) {
        document.querySelectorAll(".folder-browser").forEach(function (browser) {
            var headingTag = browser.getAttribute("data-card-heading") || "h3";
            browser.querySelectorAll("[data-project-folder]").forEach(function (panel) {
                var category = panel.getAttribute("data-project-folder");
                var grid = panel.querySelector(".project-grid");
                if (!grid) return;
                var items = window.PROJECTS.filter(function (project) {
                    return project.category === category;
                }).sort(function (a, b) {
                    return (a.sortOrder || 0) - (b.sortOrder || 0);
                });
                var cards = items.map(function (project) {
                    return projectCard(project, headingTag);
                });
                if (grid.replaceChildren) grid.replaceChildren.apply(grid, cards);
                else {
                    grid.innerHTML = "";
                    cards.forEach(function (card) { grid.appendChild(card); });
                }
                var tab = browser.querySelector('[aria-controls="' + panel.id + '"] .folder-count');
                if (tab) tab.textContent = String(items.length);
            });
        });

        document.querySelectorAll("[data-project-resources]").forEach(function (section) {
            var project = window.PROJECTS.filter(function (item) {
                return item.id === section.getAttribute("data-project-resources");
            })[0];
            if (!project) return;
            var list = section.querySelector(".file-list");
            if (list) list.textContent = "";
            var count = fillResourceList(list, project);
            section.hidden = !count;
        });
    }
    }

    function applyProfile() {
        var profile = window.PROFILE;
        if (!profile) return;
        var text = {
            "hero-headline": profile.headline,
            "hero-tagline": profile.tagline,
            "profile-degree": profile.degree,
            "profile-experience": profile.experience
        };
        Object.keys(text).forEach(function (id) {
            var node = document.getElementById(id);
            if (node && text[id]) node.textContent = text[id];
        });
        var about = document.getElementById("about-copy");
        if (about && profile.about && profile.about.length) {
            about.textContent = "";
            profile.about.forEach(function (paragraph) {
                var p = document.createElement("p");
                p.textContent = paragraph;
                about.appendChild(p);
            });
        }
        var skills = document.getElementById("skill-grid");
        if (skills && window.SKILLS && window.SKILLS.length) {
            skills.textContent = "";
            window.SKILLS.forEach(function (group) {
                var card = document.createElement("article");
                card.className = "skill-card";
                var heading = document.createElement("h3");
                heading.textContent = group.title;
                var list = document.createElement("ul");
                (group.items || []).forEach(function (item) {
                    var li = document.createElement("li");
                    li.textContent = item;
                    list.appendChild(li);
                });
                card.appendChild(heading);
                card.appendChild(list);
                skills.appendChild(card);
            });
        }
    }

    renderDynamic();
    applyProfile();
    if (window.CONTENT_READY && window.CONTENT_READY.then) {
        window.CONTENT_READY.then(function (changed) {
            if (!changed) return;
            renderDynamic();
            applyProfile();
        }).catch(function () {});
    }

    var params = new URLSearchParams(window.location.search);
    var redirect = document.body.getAttribute("data-project-redirect");
    if (redirect === "true") {
        var id = params.get("id");
        var title = (params.get("title") || "").toLowerCase();
        var routes = {
            izaks: "project-izaks.html",
            etransit: "project-etransit.html",
            "power-bi": "project-power-bi.html",
            gojobfair: "project-gojobfair.html",
            content: "project-content.html",
            "ai-media": "project-ai.html"
        };
        var target = routes[id] || "";
        if (!target && (title.indexOf("e-commerce") !== -1 || title.indexOf("izak") !== -1)) {
            target = routes.izaks;
        } else if (!target && (title.indexOf("etransit") !== -1 || title.indexOf("analytics dashboard") !== -1)) {
            target = routes.etransit;
        }
        if (target) window.location.replace(target);
    }
})();
