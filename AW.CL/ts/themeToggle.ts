/**
 * 主题切换
 */
export function initThemeToggle(): void {
    try {
        const themeToggle = document.querySelector<HTMLElement>('.theme-toggle');
        const root = document.documentElement;

        if (!themeToggle) {
            console.error('Theme toggle button not found.');
            return;
        }

        type ThemePreference = 'dark' | 'light' | 'system';
        const savedTheme: ThemePreference = (localStorage.getItem('theme') as ThemePreference) || 'system';

        if (savedTheme === 'system') {
            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.dataset.theme = isDarkMode ? 'dark' : 'light';
        } else {
            root.dataset.theme = savedTheme;
        }

        themeToggle.addEventListener('click', () => {
            const currentTheme = root.dataset.theme || 'light';
            const newTheme: 'dark' | 'light' = currentTheme === 'dark' ? 'light' : 'dark';

            root.dataset.theme = newTheme;
            localStorage.setItem('theme', newTheme);
        });
    } catch (error) {
        console.error('Failed to initialize theme toggle:', error);
    }
}

