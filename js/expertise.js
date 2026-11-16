(function () {
    var root = document.getElementById("expertise-root");
    if (!root || !window.EXPERTISE) return;
    var motifs = {
        lines: '<svg class="motif-svg" viewBox="0 0 800 420" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1"><path d="M0 80h800M0 160h800M0 240h800M0 320h800"/><path d="M80 0v420M200 0v420M360 0v420M560 0v420M700 0v420"/></g></svg>',
        dots: '<svg class="motif-svg" viewBox="0 0 800 420" aria-hidden="true"><g fill="currentColor">' + dots() + "</g></svg>",
        smoke: '<svg class="motif-svg motif-float" viewBox="0 0 800 420" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.2"><path d="M-20 250C80 80 180 360 320 200s180-40 280 40 160-80 240 20"/><path d="M-40 300C90 140 200 380 340 230s170-70 290 20 150-60 250 10"/><path d="M0 180C120 40 220 280 360 150s160 20 260 80 140-40 200 30"/></g></svg>',
        waves: '<svg class="motif-svg motif-float" viewBox="0 0 800 420" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4"><path d="M0 120c80-70 160-70 240 0s160 70 240 0 160-70 240 0 160 70 240 0"/><path d="M0 220c90-80 170-80 260 0s170 80 260 0 170-80 260 0"/><path d="M0 320c70-50 150-50 220 0s150 50 220 0 150-50 220 0 140 50 200 0"/></g></svg>',
        botanical: '<svg class="motif-svg motif-float" viewBox="0 0 420 520" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.2"><path d="M210 500c8-80 4-140-6-190"/><path d="M204 310c-70-20-120-70-140-130 50 10 90 40 140 130z"/><path d="M204 250c-40-60-30-120 10-160 10 50 10 100-10 160z"/><path d="M210 240c50-50 110-60 150-30-40 20-80 40-150 30z"/><path d="M214 200c60-10 110 20 140 70-50-10-90-30-140-70z"/><circle cx="208" cy="188" r="18"/></g></svg>',
        rules: '<svg class="motif-svg" viewBox="0 0 800 420" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1"><path d="M40 0v420M120 0v420M200 0v420M640 40h120M640 120h120M640 200h120M40 380h720"/></g></svg>'
    };

    function dots() {
        var marks = [];
        for (var y = 24; y < 420; y += 28) {
            for (var x = 20; x < 800; x += 28) marks.push('<circle cx="' + x + '" cy="' + y + '" r="1.2"/>');
        }
        return marks.join("");
    }

    function render(items) {
        root.textContent = "";
        items.slice().sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); }).forEach(function (item) {
            var section = document.createElement("section");
            section.className = "essay motif-" + (item.motif || "lines");
            section.id = item.slug;
            var motif = motifs[item.motif] || motifs.lines;
            var highlights = item.highlights || [];
            section.innerHTML = motif + '<div class="container essay-grid"><div class="essay-copy reveal"><p class="eyebrow">' + escapeText(item.slug || "") + '</p><h2></h2><p class="lead"></p><div class="essay-body"></div><ul class="tech-row"></ul></div><figure class="essay-figure reveal"></figure></div>';
            section.querySelector(".eyebrow").textContent = "Area";
            section.querySelector("h2").textContent = item.title || "";
            section.querySelector(".lead").textContent = item.intro || "";
            section.querySelector(".essay-body").textContent = item.body || "";
            var list = section.querySelector(".tech-row");
            highlights.forEach(function (highlight) {
                var li = document.createElement("li");
                li.textContent = highlight;
                if (String(highlight).indexOf("TODO:") === 0) li.className = "is-todo";
                list.appendChild(li);
            });
            var figure = section.querySelector(".essay-figure");
            if (item.image_url && String(item.image_url).indexOf("TODO:") !== 0) {
                var img = document.createElement("img");
                img.src = item.image_url;
                img.alt = "";
                figure.appendChild(img);
            } else {
                figure.innerHTML = motifs[item.motif] || motifs.botanical;
            }
            root.appendChild(section);
        });
        reveal();
    }

    function escapeText(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
        });
    }

    function reveal() {
        var nodes = root.querySelectorAll(".reveal");
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
            nodes.forEach(function (node) { node.classList.add("is-in"); });
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) entry.target.classList.add("is-in");
            });
        }, { threshold: 0.18 });
        nodes.forEach(function (node) { observer.observe(node); });
    }

    render(window.EXPERTISE);

    var cfg = window.SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey) return;
    var ready = window.CONTENT_READY || Promise.resolve(false);
    ready.then(function () {
        if (!window.supabase) return null;
        var client = window.SUPABASE_CLIENT || window.supabase.createClient(cfg.url, cfg.anonKey);
        return client.from("expertise").select("*").eq("published", true).order("sort_order");
    }).then(function (result) {
        if (!result || result.error || !result.data || !result.data.length) return;
        var motifsBySlug = {};
        window.EXPERTISE.forEach(function (item) { motifsBySlug[item.slug] = item.motif; });
        render(result.data.map(function (item) {
            item.motif = motifsBySlug[item.slug] || "lines";
            return item;
        }));
    }).catch(function () {});
})();
