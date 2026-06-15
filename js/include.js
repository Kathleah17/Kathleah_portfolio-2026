// include.js
async function includeHTML() {
    const elements = document.querySelectorAll('[data-include]');
    for (let el of elements) {
        const file = el.getAttribute('data-include');
        try {
            const response = await fetch(file);
            if (response.ok) {
                el.innerHTML = await response.text();
            }
        } catch (e) {
            console.error("Error loading include:", file);
        }
    }
    // Tell the page that includes are finished
    window.dispatchEvent(new Event('includesLoaded'));
}

document.addEventListener('DOMContentLoaded', includeHTML);