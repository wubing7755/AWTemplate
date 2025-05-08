export const ScriptsInOne = (() => {
    return {
        initialize() {
            console.log('Initializing scripts...');

            // 挂载侧边栏拖拽
            if (typeof initSidebarDrag === 'function') {
                window.initSidebarDrag();
            }

            // 挂载主题切换
            if (typeof initThemeToggle === 'function') {
                window.initThemeToggle();
            }

            // 关闭页面前执行销毁任务
            window.addEventListener('beforeunload', () => this.cleanup());
        },
        cleanup() {
            // 执行主题切换清理
            document.documentElement.removeAttribute('data-theme');
        },
        forcecleanup() {
            /**
             * 强制清除
             */

            this.cleanup();

            localStorage.removeItem('theme');
        }
    };
})();

window.ScriptsInOne = ScriptsInOne;
