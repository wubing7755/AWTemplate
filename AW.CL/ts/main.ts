import { DragManager } from './sidebarDrag.js';
import { initThemeToggle } from './themeToggle.js';

interface IScriptsInOne {
    initialize(): void;
    cleanup(fullCleanup?: boolean): void;
    forceCleanup(): void;
}

export const ScriptsInOne: IScriptsInOne = (() => {
    return {
        /**
         * 初始化所有脚本功能
         */
        initialize(): void {
            console.log('Initializing scripts...');
            
            DragManager.init();
            initThemeToggle();

            window.addEventListener('beforeunload', () => ScriptsInOne.cleanup());
        },

        /**
         * 清理当前主题设置和拖拽实例
         * @param _fullCleanup
         */
        cleanup(_fullCleanup?: boolean): void {
            document.documentElement.removeAttribute('data-theme');
            DragManager.init();
        },

        /**
         * 强制清理：清除 localStorage 中的主题设置
         */
        forceCleanup(): void {
            this.cleanup();
            localStorage.removeItem('theme');
        },
    };
})();
