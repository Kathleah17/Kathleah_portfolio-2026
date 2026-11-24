/* Convenience shortcut only. The code is visible in this public file.
   It redirects to admin.html and does not sign anyone in.
   Change ADMIN_SHORTCUT to a private phrase. TODO-SET-CODE is the placeholder. */
window.ADMIN_SHORTCUT = "TODO-SET-CODE";

(function () {
    var code = String(window.ADMIN_SHORTCUT || "");
    if (!code) return;
    var buffer = "";
    document.addEventListener("keydown", function (event) {
        var target = event.target;
        var tag = target && target.tagName ? target.tagName.toLowerCase() : "";
        if (tag === "input" || tag === "textarea" || tag === "select" || (target && target.isContentEditable)) return;
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        if (!event.key || event.key.length !== 1) return;
        buffer = (buffer + event.key).slice(-code.length);
        if (buffer === code) window.location.href = "admin.html";
    });
})();
