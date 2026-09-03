(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    let initialized = false;
    let theme;

    function isTheme(value) {
        return value === 'dark' || value === 'light';
    }

    function getSystemTheme() {
        return darkModeMediaQuery.matches ? 'dark' : 'light';
    }

    function getStoredTheme() {
        try {
            const storedTheme = localStorage.getItem('theme');
            return isTheme(storedTheme) ? storedTheme : null;
        } catch {
            return null;
        }
    }

    function persistTheme(nextTheme) {
        try {
            localStorage.setItem('theme', nextTheme);
        } catch {
            // The theme still works when storage is unavailable.
        }
    }

    function applyTheme(nextTheme, persist = true) {
        theme = nextTheme;
        document.documentElement.setAttribute('data-theme', theme);

        if (persist) {
            persistTheme(theme);
        }
    }

    function toggleDarkMode() {
        applyTheme(theme === 'dark' ? 'light' : 'dark');
    }

    function init() {
        if (initialized) return;
        initialized = true;

        darkModeMediaQuery.addEventListener('change', (event) => {
            applyTheme(event.matches ? 'dark' : 'light');
        });

        const mutationObserver = new MutationObserver(() => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (isTheme(currentTheme) && currentTheme !== theme) {
                theme = currentTheme;
                persistTheme(theme);
            }
        });

        mutationObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        window.addEventListener('storage', (event) => {
            if (event.storageArea !== localStorage || event.key !== 'theme') return;

            const nextTheme = isTheme(event.newValue) ? event.newValue : getSystemTheme();
            applyTheme(nextTheme, false);
        });

        const darkModeToggleButton = document.getElementById('dark-mode-toggle');
        if (!darkModeToggleButton) {
            throw new Error('Dark mode toggle button not found');
        }

        darkModeToggleButton.addEventListener('click', toggleDarkMode);
    }

    applyTheme(getStoredTheme() ?? getSystemTheme());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
