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

    document.querySelectorAll(".filters").forEach(function (group) {
        var gridId = group.getAttribute("aria-controls");
        var grid = gridId ? document.getElementById(gridId) : null;
        if (!grid) return;

        group.querySelectorAll(".filter-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var filter = btn.getAttribute("data-filter");
                group.querySelectorAll(".filter-btn").forEach(function (other) {
                    other.setAttribute("aria-pressed", other === btn ? "true" : "false");
                });
                grid.querySelectorAll("[data-category]").forEach(function (card) {
                    var show = filter === "all" || card.getAttribute("data-category") === filter;
                    card.hidden = !show;
                });
            });
        });
    });

    var params = new URLSearchParams(window.location.search);
    var redirect = document.body.getAttribute("data-project-redirect");
    if (redirect === "true") {
        var id = params.get("id");
        var title = (params.get("title") || "").toLowerCase();
        var routes = {
            izaks: "project-izaks.html",
            etransit: "project-etransit.html",
            "power-bi": "project-power-bi.html",
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
