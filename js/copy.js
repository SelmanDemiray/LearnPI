// Attach copy-to-clipboard functionality to all .copy-btn buttons in modals
document.addEventListener('DOMContentLoaded', function () {
    document.body.addEventListener('click', function (e) {
        if (e.target.classList.contains('copy-btn')) {
            const pre = e.target.closest('pre');
            if (!pre) return;
            const code = pre.querySelector('code');
            if (!code) return;
            // Remove leading/trailing whitespace and normalize line endings
            const text = code.innerText.replace(/\r\n/g, '\n').trim();
            navigator.clipboard.writeText(text).then(() => {
                e.target.textContent = 'Copied!';
                setTimeout(() => {
                    e.target.textContent = 'Copy';
                }, 1200);
            });
        }
    });
});
