function initThemeToggle() {
    /**
     * 主题切换：Dark/Light
     * 在localStorage中存储用户选择
     */

    try {
        const themeToggle = document.querySelector('.theme-toggle');
        const root = document.documentElement;

        if (!themeToggle) {
            console.error('Theme toggle button not found.');
            return;
        }

        // 从localStorage读取保存的主题
        const savedTheme = localStorage.getItem('theme') || 'system';

        if (savedTheme === 'system') {
            // 操作系统的主题
            root.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        else {
            // 用户选择的主题
            root.dataset.theme = savedTheme;
        }

        themeToggle.addEventListener('click', () => {
            const currentTheme = root.dataset.theme;
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            root.dataset.theme = newTheme;
            localStorage.setItem('theme', newTheme);
        });
    } catch (error) {
        console.error('Failed to initialize theme toggle:', error);
    }
}

window.initThemeToggle = initThemeToggle;
