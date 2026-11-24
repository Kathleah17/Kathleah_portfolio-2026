/* Theme colors. A blocking script in the head applies the cached palette
   before the page paints. Supabase is optional: a failed request leaves the
   built-in colors when nothing has been saved, and leaves the last saved
   palette in place when one has. */
(function () {
    var KEY = "portfolio-theme";
    var SLOTS = ["primary", "secondary", "third", "fourth"];
    var LABELS = { primary: "Primary", secondary: "Secondary", third: "Third", fourth: "Fourth" };
    var LIGHT_SURFACES = {
        "--bg": "#f3efe7",
        "--bg-raised": "#fbf8f3",
        "--ink": "#1d1a16",
        "--muted": "#534c44",
        "--line": "#e3dcd1",
        "--neu-surface": "#efeae2",
        "--folder-body": "#f7f3ec",
        "--photo-bg": "#d9d2c8",
        "--todo-bg": "#faf6ee"
    };

    function pad(n) {
        var hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    function normalizeHex(value) {
        if (value == null) return "";
        var text = String(value).trim().replace(/^#/, "");
        if (/^[0-9a-fA-F]{3}$/.test(text)) {
            text = text.charAt(0) + text.charAt(0) + text.charAt(1) + text.charAt(1) + text.charAt(2) + text.charAt(2);
        }
        if (!/^[0-9a-fA-F]{6}$/.test(text)) return "";
        return "#" + text.toLowerCase();
    }

    function hexToRgb(hex) {
        var clean = normalizeHex(hex);
        return {
            r: parseInt(clean.slice(1, 3), 16),
            g: parseInt(clean.slice(3, 5), 16),
            b: parseInt(clean.slice(5, 7), 16)
        };
    }

    function rgbToHex(r, g, b) {
        return "#" + pad(r) + pad(g) + pad(b);
    }

    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var h = 0;
        var s = 0;
        var l = (max + min) / 2;
        if (max !== min) {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h /= 6;
        }
        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    function hslToRgb(h, s, l) {
        h = ((h % 360) + 360) % 360 / 360;
        s /= 100;
        l /= 100;
        function hue(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }
        if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 };
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        return {
            r: hue(p, q, h + 1 / 3) * 255,
            g: hue(p, q, h) * 255,
            b: hue(p, q, h - 1 / 3) * 255
        };
    }

    function hslHex(h, s, l) {
        var rgb = hslToRgb(h, s, l);
        return rgbToHex(rgb.r, rgb.g, rgb.b);
    }

    function hexToHsl(hex) {
        var rgb = hexToRgb(hex);
        return rgbToHsl(rgb.r, rgb.g, rgb.b);
    }

    function channel(v) {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }

    function luminance(hex) {
        var rgb = hexToRgb(hex);
        return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
    }

    function contrast(a, b) {
        var left = luminance(a);
        var right = luminance(b);
        var lighter = Math.max(left, right);
        var darker = Math.min(left, right);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function bestText(bg) {
        var dark = "#14211b";
        var light = "#f7f3ec";
        return contrast(dark, bg) >= contrast(light, bg) ? dark : light;
    }

    function clamp(n, min, max) {
        return Math.max(min, Math.min(max, n));
    }

    function autoDarkBg(primary) {
        var hsl = hexToHsl(primary);
        return hslHex(hsl.h, clamp(hsl.s * 0.22, 6, 18), 7);
    }

    function autoDarkSurface(primary) {
        var hsl = hexToHsl(primary);
        return hslHex(hsl.h, clamp(hsl.s * 0.2, 6, 16), 12);
    }

    function shiftLight(hex, delta) {
        var hsl = hexToHsl(hex);
        return hslHex(hsl.h, hsl.s, clamp(hsl.l + delta, 4, 96));
    }

    /* A dark-mode brand color has to work as text on the dark page and as a
       button fill with its own text. Search lightness, then ease saturation. */
    function autoDarkBrand(lightHex, pageBg) {
        var hsl = hexToHsl(lightHex);
        var baseS = clamp(hsl.s * 0.75, 26, 58);
        var best = null;
        var step;
        for (step = 0; step <= 8; step += 1) {
            var s = clamp(baseS - step * 4, 16, 58);
            var L;
            for (L = 50; L <= 82; L += 1) {
                var hex = hslHex(hsl.h, s, L);
                var text = bestText(hex);
                var onPage = contrast(hex, pageBg);
                var onButton = contrast(text, hex);
                if (onPage >= 4.5 && onButton >= 4.5) {
                    var score = Math.abs(L - 66) + Math.abs(s - baseS) * 0.2;
                    if (!best || score < best.score) best = { hex: hex, text: text, score: score };
                }
            }
            if (best) return best;
        }
        var fallback = hslHex(hsl.h, 42, 72);
        return { hex: fallback, text: bestText(fallback) };
    }

    function readableMuted(bg, toward) {
        var guess = "#d4cdc2";
        if (contrast(guess, bg) >= 4.5) return guess;
        var bgHsl = hexToHsl(bg);
        var inkHsl = hexToHsl(toward);
        var L;
        for (L = inkHsl.l; L >= 40; L -= 1) {
            guess = hslHex(bgHsl.h, 12, L);
            if (contrast(guess, bg) >= 4.5) return guess;
        }
        return toward;
    }

    function defaultTheme() {
        return {
            light: { primary: "#1e4a3a", secondary: "#8a6a3b", third: null, fourth: null },
            dark: {
                primary: "#8fbfa6",
                secondary: "#d4b483",
                third: null,
                fourth: null,
                bg: "#141311",
                surface: "#1e1c19",
                auto: { primary: true, secondary: true, third: true, fourth: true, bg: true, surface: true }
            }
        };
    }

    function activeSlots(light) {
        return SLOTS.filter(function (key) { return !!normalizeHex(light[key]); });
    }

    function suggestSlot(light, key) {
        var primary = normalizeHex(light.primary) || "#1e4a3a";
        var hsl = hexToHsl(primary);
        var turn = key === "third" ? 48 : 188;
        return hslHex(hsl.h + turn, clamp(hsl.s, 24, 46), clamp(hsl.l + 8, 28, 42));
    }

    function resolve(theme) {
        var light = {
            primary: normalizeHex(theme.light.primary) || "#1e4a3a",
            secondary: normalizeHex(theme.light.secondary) || "#8a6a3b",
            third: normalizeHex(theme.light.third) || null,
            fourth: normalizeHex(theme.light.fourth) || null
        };
        if (!light.third) light.fourth = null;
        var auto = Object.assign({
            primary: true, secondary: true, third: true, fourth: true, bg: true, surface: true
        }, (theme.dark && theme.dark.auto) || {});
        var bg = normalizeHex(theme.dark && theme.dark.bg) || autoDarkBg(light.primary);
        var surface = normalizeHex(theme.dark && theme.dark.surface) || autoDarkSurface(light.primary);
        var dark = { bg: bg, surface: surface, auto: auto };
        SLOTS.forEach(function (key) {
            if (!light[key]) {
                dark[key] = null;
                return;
            }
            dark[key] = normalizeHex(theme.dark && theme.dark[key]) || autoDarkBrand(light[key], bg).hex;
        });
        return { light: light, dark: dark };
    }

    function lightTokens(resolved) {
        var primary = resolved.light.primary;
        var secondary = resolved.light.secondary;
        var tokens = {
            "--accent": primary,
            "--accent-strong": shiftLight(primary, -8),
            "--on-accent": bestText(primary),
            "--brass": secondary,
            "--todo-border": secondary,
            "--focus": shiftLight(secondary, 28)
        };
        if (resolved.light.third) tokens["--link"] = resolved.light.third;
        if (resolved.light.fourth) tokens["--highlight"] = resolved.light.fourth;
        return tokens;
    }

    function darkTokens(resolved) {
        var bg = resolved.dark.bg;
        var surface = resolved.dark.surface;
        var primary = resolved.dark.primary;
        var secondary = resolved.dark.secondary;
        var ink = contrast("#f6f1e8", bg) >= 4.5 ? "#f6f1e8" : bestText(bg);
        var surfaceHsl = hexToHsl(surface);
        var tokens = {
            "--bg": bg,
            "--bg-raised": surface,
            "--ink": ink,
            "--muted": readableMuted(bg, ink),
            "--line": hslHex(surfaceHsl.h, clamp(surfaceHsl.s, 6, 18), clamp(surfaceHsl.l + 14, 18, 36)),
            "--accent": primary,
            "--accent-strong": shiftLight(primary, 8),
            "--on-accent": bestText(primary),
            "--brass": secondary,
            "--todo-border": secondary,
            "--focus": bestText(bg),
            "--todo-bg": hslHex(surfaceHsl.h, clamp(surfaceHsl.s, 6, 16), clamp(surfaceHsl.l + 4, 10, 24)),
            "--photo-bg": hslHex(surfaceHsl.h, clamp(surfaceHsl.s, 4, 14), clamp(surfaceHsl.l + 2, 8, 22)),
            "--neu-surface": hslHex(surfaceHsl.h, clamp(surfaceHsl.s, 4, 14), clamp(surfaceHsl.l - 1, 6, 20)),
            "--folder-body": hslHex(surfaceHsl.h, clamp(surfaceHsl.s, 6, 16), clamp(surfaceHsl.l + 3, 10, 24))
        };
        if (resolved.light.third) tokens["--link"] = resolved.dark.third;
        if (resolved.light.fourth) tokens["--highlight"] = resolved.dark.fourth;
        return tokens;
    }

    function cssBlock(selector, tokens) {
        var lines = Object.keys(tokens).map(function (key) { return key + ":" + tokens[key]; });
        return selector + "{" + lines.join(";") + "}";
    }

    function buildPack(theme) {
        var resolved = resolve(theme);
        var light = lightTokens(resolved);
        var dark = darkTokens(resolved);
        return {
            light: resolved.light,
            dark: resolved.dark,
            tokens: { light: light, dark: dark },
            css: cssBlock(":root", light) + cssBlock(':root[data-theme="dark"]', dark)
        };
    }

    function previewTokens(mode, pack) {
        var tokens = Object.assign({}, mode === "dark" ? {} : LIGHT_SURFACES, pack.tokens[mode]);
        if (mode === "light") {
            tokens["--bg"] = LIGHT_SURFACES["--bg"];
            tokens["--bg-raised"] = LIGHT_SURFACES["--bg-raised"];
            tokens["--ink"] = LIGHT_SURFACES["--ink"];
            tokens["--muted"] = LIGHT_SURFACES["--muted"];
        }
        return tokens;
    }

    var currentPack = null;

    function installCss(css) {
        var node = document.getElementById("portfolio-theme");
        if (!css) {
            if (node && node.parentNode) node.parentNode.removeChild(node);
            return;
        }
        if (!node) {
            node = document.createElement("style");
            node.id = "portfolio-theme";
            document.head.appendChild(node);
        }
        node.textContent = css;
    }

    function chromeColor(dark) {
        if (!currentPack) return dark ? "#141311" : "#f3efe7";
        if (dark) return currentPack.tokens.dark["--bg"] || "#141311";
        return "#f3efe7";
    }

    function syncMeta() {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        var dark = document.documentElement.getAttribute("data-theme") === "dark";
        meta.setAttribute("content", chromeColor(dark));
    }

    function applyPack(pack, persist) {
        currentPack = pack;
        installCss(pack.css);
        syncMeta();
        if (persist) {
            try { localStorage.setItem(KEY, JSON.stringify(pack)); } catch (err) {}
        }
    }

    function boot() {
        try {
            var raw = localStorage.getItem(KEY);
            if (!raw) return;
            var pack = JSON.parse(raw);
            if (!pack || !pack.css || !pack.light || !pack.dark) return;
            applyPack(pack, false);
        } catch (err) {}
    }

    boot();

    function refresh(client) {
        if (!client) return Promise.resolve(false);
        return client.from("theme_settings").select("light,dark").eq("id", 1).maybeSingle().then(function (result) {
            if (result.error || !result.data || !result.data.light || !result.data.dark) return false;
            applyPack(buildPack({ light: result.data.light, dark: result.data.dark }), true);
            return true;
        }).catch(function () { return false; });
    }

    function styleText(tokens) {
        return Object.keys(tokens).map(function (key) { return key + ":" + tokens[key]; }).join(";");
    }

    function contrastNote(hex, bg, minimum) {
        var ratio = contrast(hex, bg);
        if (ratio >= minimum) return "";
        return "This is " + ratio.toFixed(1) + ":1 on the page background. Aim for " + minimum + ":1 so text and buttons stay readable.";
    }

    var editorState = null;

    function renderEditor() {
        var root = document.getElementById("theme-editor");
        if (!root || !editorState) return;
        var theme = editorState.theme;
        var slots = activeSlots(theme.light);
        root.textContent = "";

        var intro = document.createElement("p");
        intro.className = "note";
        intro.textContent = "Primary and Secondary are required. Dark mode colors are generated to stay readable, and any of them can be overridden.";
        root.appendChild(intro);

        slots.forEach(function (key) {
            root.appendChild(slotCard(key));
        });

        var add = document.createElement("button");
        add.type = "button";
        add.className = "btn btn-ghost";
        add.textContent = "+ Add color";
        if (slots.length >= 4) add.hidden = true;
        add.addEventListener("click", function () {
            var next = SLOTS.filter(function (key) { return !normalizeHex(theme.light[key]); })[0];
            if (!next) return;
            theme.light[next] = suggestSlot(theme.light, next);
            theme.dark.auto[next] = true;
            theme.dark[next] = null;
            updateLive(true);
        });
        root.appendChild(add);

        var derived = document.createElement("div");
        derived.className = "theme-derived";
        derived.appendChild(derivedRow("bg", "Dark background"));
        derived.appendChild(derivedRow("surface", "Dark surface"));
        root.appendChild(derived);

        var actions = document.createElement("div");
        actions.className = "hire-actions";
        var save = document.createElement("button");
        save.type = "button";
        save.className = "btn";
        save.textContent = "Save theme";
        save.addEventListener("click", saveTheme);
        var reset = document.createElement("button");
        reset.type = "button";
        reset.className = "btn btn-ghost";
        reset.textContent = "Reset to default";
        reset.addEventListener("click", function () {
            editorState.theme = defaultTheme();
            updateLive(true);
            if (editorState.preview || !editorState.client) {
                say("Defaults restored in this preview. Nothing is saved.");
                return;
            }
            saveTheme();
        });
        actions.appendChild(save);
        actions.appendChild(reset);
        root.appendChild(actions);

        var previews = document.createElement("div");
        previews.className = "theme-previews";
        previews.appendChild(preview("light", "Light"));
        previews.appendChild(preview("dark", "Dark"));
        root.appendChild(previews);
        root.appendChild(statusLine());
    }

    function statusLine() {
        var p = document.createElement("p");
        p.id = "theme-status";
        p.className = "status";
        p.setAttribute("role", "status");
        p.hidden = true;
        return p;
    }

    function say(text, isError) {
        var node = document.getElementById("theme-status");
        if (!node) return;
        node.hidden = !text;
        node.textContent = text || "";
        node.classList.toggle("is-error", !!isError);
    }

    function slotCard(key) {
        var theme = editorState.theme;
        var card = document.createElement("fieldset");
        card.className = "theme-slot";
        var legend = document.createElement("legend");
        legend.textContent = LABELS[key];
        card.appendChild(legend);

        card.appendChild(colorRow("Light", theme.light[key], function (hex, rerender) {
            theme.light[key] = hex;
            if (theme.dark.auto[key]) theme.dark[key] = null;
            if (key === "primary" && theme.dark.auto.bg) theme.dark.bg = null;
            if (key === "primary" && theme.dark.auto.surface) theme.dark.surface = null;
            updateLive(!!rerender);
        }, ""));

        var resolved = resolve(theme);
        card.appendChild(colorRow("Dark", resolved.dark[key], function (hex, rerender) {
            if (hex !== resolve(theme).dark[key]) {
                theme.dark[key] = hex;
                theme.dark.auto[key] = false;
            }
            updateLive(!!rerender);
        }, key));

        var tools = document.createElement("div");
        tools.className = "theme-slot-tools";
        if (theme.dark.auto[key]) {
            var auto = document.createElement("span");
            auto.className = "theme-auto";
            auto.textContent = "Dark color is automatic";
            tools.appendChild(auto);
        } else {
            var resetAuto = document.createElement("button");
            resetAuto.type = "button";
            resetAuto.className = "btn btn-ghost";
            resetAuto.textContent = "Reset to auto";
            resetAuto.addEventListener("click", function () {
                theme.dark.auto[key] = true;
                theme.dark[key] = null;
                updateLive(true);
            });
            tools.appendChild(resetAuto);
        }
        if (key !== "primary" && key !== "secondary") {
            var remove = document.createElement("button");
            remove.type = "button";
            remove.className = "theme-remove";
            remove.setAttribute("aria-label", "Remove " + LABELS[key]);
            remove.textContent = "×";
            remove.addEventListener("click", function () {
                if (key === "third" && normalizeHex(theme.light.fourth)) {
                    theme.light.third = theme.light.fourth;
                    theme.dark.third = theme.dark.fourth;
                    theme.dark.auto.third = theme.dark.auto.fourth;
                } else {
                    theme.light[key] = null;
                    theme.dark[key] = null;
                    theme.dark.auto[key] = true;
                }
                if (key === "third") {
                    theme.light.fourth = null;
                    theme.dark.fourth = null;
                    theme.dark.auto.fourth = true;
                }
                if (key === "fourth") {
                    theme.light.fourth = null;
                    theme.dark.fourth = null;
                    theme.dark.auto.fourth = true;
                }
                updateLive(true);
            });
            tools.appendChild(remove);
        }
        card.appendChild(tools);

        var minimum = key === "secondary" ? 3 : 4.5;
        var warning = contrastNote(theme.light[key], "#f3efe7", minimum);
        if (warning) {
            var warn = document.createElement("p");
            warn.className = "theme-warn";
            warn.textContent = warning;
            card.appendChild(warn);
        }
        return card;
    }

    function derivedRow(key, label) {
        var theme = editorState.theme;
        var wrap = document.createElement("fieldset");
        wrap.className = "theme-slot";
        var legend = document.createElement("legend");
        legend.textContent = label;
        wrap.appendChild(legend);
        var resolved = resolve(theme);
        wrap.appendChild(colorRow("Dark", resolved.dark[key], function (hex, rerender) {
            if (hex !== resolve(theme).dark[key]) {
                theme.dark[key] = hex;
                theme.dark.auto[key] = false;
            }
            updateLive(!!rerender);
        }, key));
        var tools = document.createElement("div");
        tools.className = "theme-slot-tools";
        if (theme.dark.auto[key]) {
            var auto = document.createElement("span");
            auto.className = "theme-auto";
            auto.textContent = "Generated from Primary";
            tools.appendChild(auto);
        } else {
            var resetAuto = document.createElement("button");
            resetAuto.type = "button";
            resetAuto.className = "btn btn-ghost";
            resetAuto.textContent = "Reset to auto";
            resetAuto.addEventListener("click", function () {
                theme.dark.auto[key] = true;
                theme.dark[key] = null;
                updateLive(true);
            });
            tools.appendChild(resetAuto);
        }
        wrap.appendChild(tools);
        return wrap;
    }

    function colorRow(label, value, onValid, bind) {
        var row = document.createElement("div");
        row.className = "theme-color-row";
        var name = document.createElement("span");
        name.textContent = label;
        var picker = document.createElement("input");
        picker.type = "color";
        picker.value = normalizeHex(value) || "#000000";
        picker.setAttribute("aria-label", label + " color");
        var hex = document.createElement("input");
        hex.type = "text";
        hex.className = "theme-hex";
        hex.value = normalizeHex(value) || "";
        hex.maxLength = 7;
        hex.spellcheck = false;
        hex.setAttribute("aria-label", label + " hex");
        hex.autocomplete = "off";
        if (bind) {
            picker.setAttribute("data-bind", bind);
            hex.setAttribute("data-bind", bind);
        }
        var error = document.createElement("span");
        error.className = "theme-warn";
        error.hidden = true;

        function commit(next, rerender) {
            var clean = normalizeHex(next);
            if (!clean) {
                error.hidden = false;
                error.textContent = "Use a 6-digit hex color.";
                return;
            }
            error.hidden = true;
            if (document.activeElement !== picker) picker.value = clean;
            if (document.activeElement !== hex) hex.value = clean;
            onValid(clean, rerender);
        }

        picker.addEventListener("input", function () { commit(picker.value, false); });
        picker.addEventListener("change", function () { commit(picker.value, true); });
        hex.addEventListener("change", function () { commit(hex.value, true); });
        hex.addEventListener("input", function () {
            var clean = normalizeHex(hex.value);
            if (!clean && hex.value.trim()) {
                error.hidden = false;
                error.textContent = "Use a 6-digit hex color.";
                return;
            }
            if (clean) {
                error.hidden = true;
                picker.value = clean;
                onValid(clean, false);
            }
        });

        row.appendChild(name);
        row.appendChild(picker);
        row.appendChild(hex);
        row.appendChild(error);
        return row;
    }

    function preview(mode, label) {
        var pack = buildPack(editorState.theme);
        var frame = document.createElement("div");
        frame.className = "theme-preview";
        frame.style.cssText = styleText(previewTokens(mode, pack));
        var kicker = document.createElement("p");
        kicker.className = "eyebrow";
        kicker.textContent = label;
        var heading = document.createElement("h3");
        heading.textContent = "Let's work together";
        var card = document.createElement("article");
        card.className = "theme-sample-card";
        var copy = document.createElement("p");
        copy.textContent = "A card on the page surface.";
        var link = document.createElement("a");
        link.href = "#theme";
        link.textContent = "View projects";
        card.appendChild(copy);
        card.appendChild(link);
        var row = document.createElement("div");
        row.className = "hire-actions";
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn";
        button.textContent = "Primary";
        var ghost = document.createElement("button");
        ghost.type = "button";
        ghost.className = "btn btn-ghost";
        ghost.textContent = "Secondary";
        row.appendChild(button);
        row.appendChild(ghost);
        frame.appendChild(kicker);
        frame.appendChild(heading);
        frame.appendChild(card);
        frame.appendChild(row);
        return frame;
    }

    function updateLive(rerender) {
        var pack = buildPack(editorState.theme);
        applyPack(pack, false);
        if (rerender) {
            renderEditor();
            return;
        }
        var frames = document.querySelectorAll("#theme-editor .theme-preview");
        if (frames[0]) frames[0].style.cssText = styleText(previewTokens("light", pack));
        if (frames[1]) frames[1].style.cssText = styleText(previewTokens("dark", pack));
        var resolved = resolve(editorState.theme);
        ["primary", "secondary", "third", "fourth", "bg", "surface"].forEach(function (key) {
            if (!editorState.theme.dark.auto[key] || !resolved.dark[key]) return;
            document.querySelectorAll('#theme-editor [data-bind="' + key + '"]').forEach(function (input) {
                if (document.activeElement === input) return;
                input.value = resolved.dark[key];
            });
        });
    }

    function saveTheme() {
        var pack = buildPack(editorState.theme);
        if (editorState.preview || !editorState.client) {
            applyPack(pack, false);
            say("Preview only. Nothing is saved.", true);
            return;
        }
        var payload = {
            id: 1,
            light: pack.light,
            dark: pack.dark,
            updated_at: new Date().toISOString()
        };
        editorState.client.from("theme_settings").upsert(payload).then(function (result) {
            if (result.error) {
                say(result.error.message, true);
                return;
            }
            applyPack(pack, true);
            say("Theme saved.");
        }).catch(function () {
            say("The theme was not saved.", true);
        });
    }

    function mount(options) {
        editorState = {
            theme: defaultTheme(),
            client: options.client || null,
            preview: !!options.preview,
            note: options.note || function () {}
        };
        renderEditor();
        if (!editorState.client) return;
        editorState.client.from("theme_settings").select("light,dark").eq("id", 1).maybeSingle().then(function (result) {
            if (result.error) {
                say("Theme colors stay on the built-in palette until the theme table exists. " + result.error.message, true);
                return;
            }
            if (!result.data) return;
            editorState.theme = {
                light: result.data.light,
                dark: result.data.dark
            };
            if (!editorState.theme.dark.auto) editorState.theme.dark.auto = defaultTheme().dark.auto;
            updateLive(true);
            say("");
        }).catch(function () {
            say("Theme colors stay on the built-in palette until Supabase responds.", true);
        });
    }

    window.PortfolioTheme = {
        normalizeHex: normalizeHex,
        contrast: contrast,
        buildPack: buildPack,
        applyPack: applyPack,
        refresh: refresh,
        chromeColor: chromeColor,
        defaultTheme: defaultTheme,
        mount: mount,
        autoDarkBrand: autoDarkBrand,
        autoDarkBg: autoDarkBg
    };
})();
