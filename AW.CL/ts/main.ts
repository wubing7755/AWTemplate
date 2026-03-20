/**
 * AWTemplate 主入口文件
 * 统一的插件系统入口，所有功能都作为插件加载
 */

// ==================== 插件系统核心 ====================

// 插件类型定义
interface AWPlugin {
    name: string;
    version?: string;
    initialize?: () => void | Promise<void>;
    dispose?: () => void | Promise<void>;
    [key: string]: any;
}

interface AWPluginLoader {
    plugins: Record<string, AWPlugin>;
    loadedScripts: Set<string>;
    register: (plugin: AWPlugin) => void;
    load: (pluginName: string, scriptPath: string) => Promise<AWPlugin>;
    loadMultiple: (plugins: Array<{name: string; path: string}>) => Promise<void>;
    invoke: (pluginName: string, methodName: string, ...args: any[]) => any;
    exists: (pluginName: string) => boolean;
    get: (pluginName: string) => AWPlugin | undefined;
    cleanup: () => void;
}

// 全局声明
declare global {
    interface Window {
        AW: AWPluginLoader;
    }
}

// 创建插件加载器实例
const createPluginLoader = (): AWPluginLoader => {
    return {
        // 已注册的插件
        plugins: {},
        
        // 已加载的脚本
        loadedScripts: new Set<string>(),
        
        /**
         * 注册插件
         */
        register(plugin: AWPlugin): void {
            if (this.plugins[plugin.name]) {
                console.warn(`[AW] 插件 "${plugin.name}" 已存在，将被覆盖`);
            }
            this.plugins[plugin.name] = plugin;
            console.log(`[AW] 插件 "${plugin.name}" 已注册`);
            
            // 如果有初始化函数，自动调用
            if (plugin.initialize && typeof plugin.initialize === 'function') {
                try {
                    plugin.initialize();
                } catch (error) {
                    console.error(`[AW] 插件 "${plugin.name}" 初始化失败:`, error);
                }
            }
        },
        
        /**
         * 动态加载插件脚本
         */
        async load(pluginName: string, scriptPath: string): Promise<AWPlugin> {
            // 如果插件已存在，直接返回
            if (this.plugins[pluginName]) {
                return this.plugins[pluginName];
            }
            
            // 如果脚本已加载，尝试获取插件
            if (this.loadedScripts.has(scriptPath)) {
                // 等待一下让脚本有时间执行
                await new Promise(resolve => setTimeout(resolve, 100));
                if (this.plugins[pluginName]) {
                    return this.plugins[pluginName];
                }
            }
            
            // 动态加载脚本
            await this.loadScript(scriptPath);
            this.loadedScripts.add(scriptPath);
            
            // 等待脚本执行并注册插件
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (!this.plugins[pluginName]) {
                throw new Error(`[AW] 插件 "${pluginName}" 加载失败`);
            }
            
            return this.plugins[pluginName];
        },
        
        /**
         * 加载脚本文件
         */
        loadScript(src: string): Promise<void> {
            return new Promise((resolve, reject) => {
                // 检查是否已加载
                const existing = document.querySelector(`script[src="${src}"]`);
                if (existing) {
                    resolve();
                    return;
                }
                
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                
                script.onload = () => {
                    console.log(`[AW] 脚本加载成功: ${src}`);
                    resolve();
                };
                
                script.onerror = (error) => {
                    console.error(`[AW] 脚本加载失败: ${src}`, error);
                    reject(new Error(`脚本加载失败: ${src}`));
                };
                
                document.head.appendChild(script);
            });
        },
        
        /**
         * 批量加载插件
         */
        async loadMultiple(plugins: Array<{name: string; path: string}>): Promise<void> {
            const promises = plugins.map(p => this.load(p.name, p.path).catch(err => {
                console.error(`[AW] 加载插件 "${p.name}" 失败:`, err);
                return null;
            }));
            
            await Promise.all(promises);
            console.log(`[AW] 已加载 ${plugins.length} 个插件`);
        },
        
        /**
         * 调用插件方法
         */
        invoke(pluginName: string, methodName: string, ...args: any[]): any {
            const plugin = this.plugins[pluginName];
            if (!plugin) {
                throw new Error(`[AW] 插件 "${pluginName}" 未找到`);
            }
            
            // 支持点号路径访问嵌套方法
            const parts = methodName.split('.');
            let current: any = plugin;
            
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (current[part] === undefined) {
                    throw new Error(`[AW] 插件 "${pluginName}" 中方法 "${methodName}" 不存在`);
                }
                current = current[part];
            }
            
            const lastPart = parts[parts.length - 1];
            const func = current[lastPart];
            
            if (typeof func !== 'function') {
                throw new Error(`[AW] 插件 "${pluginName}" 中 "${methodName}" 不是函数`);
            }
            
            return func.apply(current, args);
        },
        
        /**
         * 检查插件是否存在
         */
        exists(pluginName: string): boolean {
            return !!this.plugins[pluginName];
        },
        
        /**
         * 获取插件
         */
        get(pluginName: string): AWPlugin | undefined {
            return this.plugins[pluginName];
        },
        
        /**
         * 清理所有插件
         */
        cleanup(): void {
            Object.values(this.plugins).forEach(plugin => {
                if (plugin.dispose && typeof plugin.dispose === 'function') {
                    try {
                        plugin.dispose();
                    } catch (error) {
                        console.error(`[AW] 插件 "${plugin.name}" 清理失败:`, error);
                    }
                }
            });
            
            this.plugins = {};
            console.log('[AW] 所有插件已清理');
        }
    };
};

// 初始化全局 AW 对象
if (!window.AW) {
    window.AW = createPluginLoader();
}

// ==================== 插件定义 ====================
// 每个功能模块都作为一个插件

// 拖拽插件
import { DragManager } from './sidebarDrag.js';
window.AW.register({
    name: 'drag',
    initialize: () => {
        console.log('[AW] 拖拽插件已就绪');
    },
    dispose: () => {
        if (typeof DragManager?.destroy === 'function') {
            DragManager.destroy();
        }
    },
    instance: DragManager
});

// 主题插件
import { initThemeToggle } from './themeToggle.js';
window.AW.register({
    name: 'theme',
    initialize: () => {
        initThemeToggle();
    },
    instance: { init: initThemeToggle }
});

// HTTP 插件
import { httpClient, http, type RequestOptions, type ApiResponse } from './httpClient.js';
window.AW.register({
    name: 'http',
    instance: { client: httpClient, request: http }
});
export { httpClient, http, type RequestOptions, type ApiResponse };

// 存储插件
import { storage, session, store, type StorageOptions } from './storage.js';
window.AW.register({
    name: 'storage',
    instance: { local: storage, session, store }
});
export { storage, session, store, type StorageOptions };

// 验证插件
import { Validator, FormValidator, validate, type ValidationRule, type ValidationResult } from './validation.js';
window.AW.register({
    name: 'validation',
    instance: { Validator, FormValidator, validate, rules: Validator.rules }
});
export { Validator, FormValidator, validate, type ValidationRule, type ValidationResult };

// 通知插件
import { notification, notify } from './notification.js';
window.AW.register({
    name: 'notification',
    instance: { notification, notify }
});
export { notification, notify };

// 工具插件
import { utils } from './utilities.js';
window.AW.register({
    name: 'utils',
    instance: utils
});
export { utils };

// ==================== 便捷访问 ====================
// 将插件挂载到 window 上方便直接访问
window.addEventListener('DOMContentLoaded', () => {
    // 延迟执行确保所有插件都已注册
    setTimeout(() => {
        // 挂载常用插件到 window
        (window as any).drag = window.AW.get('drag')?.instance;
        (window as any).http = window.AW.get('http')?.instance;
        (window as any).storage = window.AW.get('storage')?.instance;
        (window as any).validate = window.AW.get('validation')?.instance;
        (window as any).notify = window.AW.get('notification')?.instance?.notify;
        (window as any).utils = window.AW.get('utils')?.instance;
        
        console.log('[AW] 所有插件已挂载到 window');
    }, 0);
});

// ==================== 导出 ====================
export const AW = window.AW;

// 批量加载函数 - 供 C# 端调用
export async function loadAllPlugins(): Promise<void> {
    const plugins = [
        { name: 'drag', path: 'js/sidebarDrag.js' },
        { name: 'theme', path: 'js/themeToggle.js' },
        { name: 'http', path: 'js/httpClient.js' },
        { name: 'storage', path: 'js/storage.js' },
        { name: 'validation', path: 'js/validation.js' },
        { name: 'notification', path: 'js/notification.js' },
        { name: 'utils', path: 'js/utilities.js' }
    ];
    
    await window.AW.loadMultiple(plugins);
}

// 清理函数 - 供 C# 端调用
export function cleanupPlugins(): void {
    window.AW.cleanup();
}
