export function initThemeToggle() {
    try {
        const themeToggle = document.querySelector('.theme-toggle');
        const root = document.documentElement;
        if (!themeToggle) {
            console.error('Theme toggle button not found.');
            return;
        }
        const savedTheme = localStorage.getItem('theme') || 'system';
        if (savedTheme === 'system') {
            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.dataset.theme = isDarkMode ? 'dark' : 'light';
        }
        else {
            root.dataset.theme = savedTheme;
        }
        themeToggle.addEventListener('click', () => {
            const currentTheme = root.dataset.theme || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            root.dataset.theme = newTheme;
            localStorage.setItem('theme', newTheme);
        });
    }
    catch (error) {
        console.error('Failed to initialize theme toggle:', error);
    }
}
//# sourceMappingURL=themeToggle.js.map