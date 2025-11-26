import { DragManager } from './sidebarDrag.js';
import { initThemeToggle } from './themeToggle.js';
export const ScriptsInOne = (() => {
    return {
        initialize() {
            console.log('Initializing scripts...');
            DragManager.init();
            initThemeToggle();
            window.addEventListener('beforeunload', () => ScriptsInOne.cleanup());
        },
        cleanup(_fullCleanup) {
            document.documentElement.removeAttribute('data-theme');
            DragManager.init();
        },
        forceCleanup() {
            this.cleanup();
            localStorage.removeItem('theme');
        },
    };
})();
//# sourceMappingURL=main.js.map