import { DragManager } from './sidebarDrag.js';
import { initThemeToggle } from './themeToggle.js';
import { httpClient, http } from './httpClient.js';
import { storage, session, store } from './storage.js';
import { Validator, FormValidator, validate } from './validation.js';
import { utils } from './utilities.js';
import { notification, notify } from './notification.js';
export { httpClient, http };
export { storage, session, store };
export { Validator, FormValidator, validate };
export { utils };
export { notification, notify };
export const AWScriptManager = (() => {
    return {
        initialize() {
            console.log('Initializing scripts...');
            window.addEventListener('beforeunload', () => AWScriptManager.cleanup());
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
export const tools = {
    drag: DragManager,
    theme: { init: initThemeToggle },
    http,
    storage,
    validate,
    utils
};
if (!window.AW) {
    window.AW = {
        plugins: {},
        registerPlugin: function (name, plugin) {
            this.plugins[name] = plugin;
            console.log(`插件 "${name}" 已注册`);
        },
        invokePlugin: function (pluginName, methodName, ...args) {
            const plugin = this.plugins[pluginName];
            if (!plugin) {
                throw new Error(`插件 "${pluginName}" 未找到`);
            }
            const parts = methodName.split('.');
            let current = plugin;
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (current[part] === undefined) {
                    throw new Error(`插件 "${pluginName}" 中方法 "${methodName}" 不存在，在 "${part}" 处中断`);
                }
                current = current[part];
            }
            const lastPart = parts[parts.length - 1];
            const func = current[lastPart];
            if (typeof func !== 'function') {
                throw new Error(`插件 "${pluginName}" 中 "${methodName}" 不是函数`);
            }
            return func.apply(current, args);
        },
        pluginExists: function (pluginName) {
            return !!this.plugins[pluginName];
        },
        methodExists: function (pluginName, methodName) {
            const plugin = this.plugins[pluginName];
            if (!plugin)
                return false;
            const parts = methodName.split('.');
            let current = plugin;
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (current[part] === undefined) {
                    return false;
                }
                current = current[part];
            }
            const lastPart = parts[parts.length - 1];
            return typeof current[lastPart] === 'function';
        },
        invokeGlobalFunction: function (functionPath, ...args) {
            const parts = functionPath.split('.');
            let current = window;
            for (const part of parts) {
                if (current[part] === undefined) {
                    throw new Error(`全局函数路径 "${functionPath}" 不存在，在 "${part}" 处中断`);
                }
                current = current[part];
            }
            if (typeof current !== 'function') {
                throw new Error(`"${functionPath}" 不是函数`);
            }
            return current.apply(window, args);
        }
    };
}
window.AW.registerPlugin('tools', {
    drag: DragManager,
    theme: { init: initThemeToggle },
    http,
    storage,
    validate,
    utils,
    notification,
    notify
});
export const AW = window.AW;
//# sourceMappingURL=main.js.map