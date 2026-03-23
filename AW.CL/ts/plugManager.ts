/**
 * PlugManager - 插件管理器
 * 类似于 VSCode 插件系统的主入口
 * 提供插件的注册、初始化、销毁等核心功能
 */

import type {
    PlugExports,
    PlugsConfig,
    PlugInitResult,
    IPlugManager,
    PlugDebug,
} from "./types";

/**
 * 插件管理器 - 单例模式
 * 负责管理所有插件的注册、初始化和销毁
 */
class PlugManagerImpl implements IPlugManager {
    // ==================== 单例实现 ====================
    private static instance: PlugManagerImpl | null = null;

    /**
     * 获取 PlugManager 单例实例
     */
    static getInstance(): PlugManagerImpl {
        if (!PlugManagerImpl.instance) {
            PlugManagerImpl.instance = new PlugManagerImpl();
        }
        return PlugManagerImpl.instance;
    }

    // ==================== 私有属性 ====================
    /** 插件注册表 */
    private plugs: Map<string, PlugExports> = new Map();

    /** 全局配置 */
    private options: PlugsConfig["options"] = {
        debug: false,
        loadOnDomContentLoaded: true,
    };

    /** 初始化状态 */
    private initialized = false;

    /** 初始化中的插件集合（防止重复初始化） */
    private initializing: Set<string> = new Set();

    /** 是否正在加载配置 */
    private loading = false;

    // ==================== 构造函数 ====================
    private constructor() {
        // 注册到全局 window 对象
        this.registerToWindow();
        
        // 检查是否有待注册的插件（在 PlugManager 加载之前就已经执行的插件）
        this.processPendingPlugs();
    }

    /**
     * 处理待注册的插件队列
     * 当插件脚本在 PlugManager 之前加载时，会将插件放入待注册队列
     */
    private processPendingPlugs(): void {
        const pendingPlugs = (window as any).__pendingPlugs;
        if (Array.isArray(pendingPlugs) && pendingPlugs.length > 0) {
            this.debug(`[PlugManager] 处理 ${pendingPlugs.length} 个待注册插件`);
            for (const plug of pendingPlugs) {
                if (plug && plug.name) {
                    this.registerPlug(plug);
                }
            }
            // 清空待注册队列
            delete (window as any).__pendingPlugs;
        }
    }

    // ==================== 核心方法 ====================

    /**
     * 注册插件
     * @param plug - 插件导出对象
     */
    registerPlug(plug: PlugExports): void {
        if (!plug || !plug.name) {
            this.error("[PlugManager] 注册失败: 插件名称不能为空");
            return;
        }

        if (this.plugs.has(plug.name)) {
            this.warn(`[PlugManager] 插件 "${plug.name}" 已存在，将被覆盖`);
        }

        this.plugs.set(plug.name, plug);
        this.debug(`[PlugManager] 注册插件: ${plug.name}`);

        // 自动挂载到 window
        this.mountExports(plug);

        // 检查是否需要自动初始化
        if (plug.autoInitialize && !this.initializing.has(plug.name)) {
            this.initializePlug(plug.name);
        }
    }

    /**
     * 获取插件
     * @param name - 插件名称
     * @returns 插件对象或 undefined
     */
    getPlug<T = PlugExports>(name: string): T | undefined {
        return this.plugs.get(name) as T | undefined;
    }

    /**
     * 检查插件是否存在
     * @param name - 插件名称
     */
    hasPlug(name: string): boolean {
        return this.plugs.has(name);
    }

    /**
     * 获取所有已注册的插件名称
     */
    getPlugNames(): string[] {
        return Array.from(this.plugs.keys());
    }

    /**
     * 初始化所有已注册的插件
     * 按注册顺序初始化
     */
    async initializeAll(): Promise<PlugInitResult[]> {
        if (this.initialized) {
            this.warn("[PlugManager] 插件系统已经初始化过");
            return [];
        }

        const results: PlugInitResult[] = [];
        const plugsArray = Array.from(this.plugs.values());

        for (const plug of plugsArray) {
            const result = await this.initializePlug(plug.name);
            results.push(result);
        }

        this.initialized = true;
        this.debug(`[PlugManager] 完成初始化 ${results.length} 个插件`);

        return results;
    }

    /**
     * 初始化指定插件
     * @param name - 插件名称
     */
    async initializePlug(name: string): Promise<PlugInitResult> {
        const startTime = performance.now();
        const result: PlugInitResult = { name, success: false };

        try {
            // 检查是否正在初始化
            if (this.initializing.has(name)) {
                result.error = "插件正在初始化中";
                return result;
            }

            const plug = this.plugs.get(name);
            if (!plug) {
                result.error = `插件 "${name}" 未找到`;
                return result;
            }

            // 标记为正在初始化
            this.initializing.add(name);

            // 调用初始化函数
            if (typeof plug.initialize === "function") {
                this.debug(`[PlugManager] 初始化插件: ${name}`);
                await plug.initialize();
            }

            result.success = true;
            result.duration = Math.round(performance.now() - startTime);
            this.debug(
                `[PlugManager] 插件 "${name}" 初始化成功 (${result.duration}ms)`,
            );
        } catch (error) {
            result.error = error instanceof Error ? error.message : String(error);
            this.error(
                `[PlugManager] 插件 "${name}" 初始化失败: ${result.error}`,
            );
        } finally {
            this.initializing.delete(name);
        }

        return result;
    }

    /**
     * 销毁所有插件
     * 按注册顺序的逆序销毁
     */
    disposeAll(): void {
        const plugsArray = Array.from(this.plugs.values()).reverse();

        for (const plug of plugsArray) {
            this.disposePlug(plug.name);
        }

        this.plugs.clear();
        this.initialized = false;
        this.debug("[PlugManager] 已销毁所有插件");
    }

    /**
     * 销毁指定插件
     * @param name - 插件名称
     */
    disposePlug(name: string): void {
        const plug = this.plugs.get(name);
        if (!plug) {
            this.warn(`[PlugManager] 插件 "${name}" 不存在，无需销毁`);
            return;
        }

        try {
            if (typeof plug.dispose === "function") {
                this.debug(`[PlugManager] 销毁插件: ${name}`);
                plug.dispose();
            }

            // 从 window 卸载
            this.unmountExports(plug);
            this.debug(`[PlugManager] 已销毁插件: ${name}`);
        } catch (error) {
            this.error(
                `[PlugManager] 销毁插件 "${name}" 时发生错误: ${error}`,
            );
        }
    }

    /**
     * 从配置对象加载并初始化插件
     * @param config - 插件配置
     */
    async loadFromConfig(config: PlugsConfig): Promise<PlugInitResult[]> {
        if (this.loading) {
            this.warn("[PlugManager] 正在加载配置中，请稍后");
            return [];
        }

        this.loading = true;

        try {
            // 更新配置选项
            if (config.options) {
                this.options = { ...this.options, ...config.options };
            }

            // 解析依赖并确定加载顺序
            const sortedPlugs = this.resolveDependencies(config.plugs);

            // 按顺序加载插件
            const results: PlugInitResult[] = [];

            for (const plugConfig of sortedPlugs) {
                // 动态加载 JS 文件
                await this.loadPlugScript(plugConfig.file);

                // 获取入口函数并注册
                const entryFn = (window as any)[plugConfig.entry];
                if (typeof entryFn === "function") {
                    const exports = entryFn();
                    if (exports && exports.name) {
                        // 应用配置中的 autoInitialize
                        if (
                            plugConfig.autoInitialize !== undefined &&
                            exports.autoInitialize !== undefined
                        ) {
                            exports.autoInitialize = plugConfig.autoInitialize;
                        }
                        this.registerPlug(exports);
                    }
                } else {
                    results.push({
                        name: plugConfig.name,
                        success: false,
                        error: `入口函数 "${plugConfig.entry}" 未找到`,
                    });
                }
            }

            // 初始化所有插件
            const initResults = await this.initializeAll();

            return results.concat(initResults);
        } catch (error) {
            this.error(`[PlugManager] 加载配置失败: ${error}`);
            return [];
        } finally {
            this.loading = false;
        }
    }

    /**
     * 从远程 URL 加载配置并初始化插件
     * @param url - 配置文件 URL
     */
    async loadConfigFromUrl(url: string): Promise<PlugInitResult[]> {
        this.debug(`[PlugManager] 从 ${url} 加载配置`);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const config: PlugsConfig = await response.json();
            return this.loadFromConfig(config);
        } catch (error) {
            this.error(`[PlugManager] 加载配置失败: ${error}`);
            return [];
        }
    }

    /**
     * 设置全局选项
     * @param options - 配置选项
     */
    setOptions(options: Partial<PlugsConfig["options"]>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * 获取全局选项
     */
    getOptions(): PlugsConfig["options"] {
        return { ...this.options };
    }

    /**
     * 获取管理器状态
     */
    getStatus(): {
        initialized: boolean;
        loading: boolean;
        plugCount: number;
        plugs: string[];
    } {
        return {
            initialized: this.initialized,
            loading: this.loading,
            plugCount: this.plugs.size,
            plugs: this.getPlugNames(),
        };
    }

    // ==================== 私有方法 ====================

    /**
     * 将插件的 exports 挂载到 window 对象
     * @param plug - 插件导出对象
     */
    private mountExports(plug: PlugExports): void {
        if (!plug.exports) return;

        for (const [key, value] of Object.entries(plug.exports)) {
            if (key in window) {
                this.debug(
                    `[PlugManager] window.${key} 已存在，将被插件 "${plug.name}" 覆盖`,
                );
            }
            (window as any)[key] = value;
            this.debug(
                `[PlugManager] 挂载 ${key} -> window.${key} (来自 ${plug.name})`,
            );
        }
    }

    /**
     * 从 window 对象卸载插件的 exports
     * @param plug - 插件导出对象
     */
    private unmountExports(plug: PlugExports): void {
        if (!plug.exports) return;

        for (const key of Object.keys(plug.exports)) {
            delete (window as any)[key];
            this.debug(`[PlugManager] 卸载 window.${key}`);
        }
    }

    /**
     * 动态加载插件脚本
     * @param file - JS 文件路径
     */
    private loadPlugScript(file: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // 检查是否已加载
            const scripts = document.querySelectorAll(`script[src="${file}"]`);
            if (scripts.length > 0) {
                this.debug(`[PlugManager] 脚本已加载: ${file}`);
                resolve();
                return;
            }

            const script = document.createElement("script");
            script.src = file;
            script.async = false;

            script.onload = () => {
                this.debug(`[PlugManager] 加载脚本成功: ${file}`);
                resolve();
            };

            script.onerror = (error) => {
                this.error(`[PlugManager] 加载脚本失败: ${file}`);
                reject(error);
            };

            document.head.appendChild(script);
        });
    }

    /**
     * 解析依赖并确定加载顺序
     * 使用拓扑排序确保依赖先于依赖者加载
     * @param plugs - 插件配置列表
     */
    private resolveDependencies(
        plugs: PlugsConfig["plugs"],
    ): PlugsConfig["plugs"] {
        const result: PlugsConfig["plugs"] = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();

        const visit = (plug: PlugsConfig["plugs"][0]): void => {
            if (visited.has(plug.name)) return;
            if (visiting.has(plug.name)) {
                this.warn(`[PlugManager] 检测到循环依赖: ${plug.name}`);
                return;
            }

            visiting.add(plug.name);

            // 先访问依赖
            if (plug.dependsOn) {
                for (const depName of plug.dependsOn) {
                    const dep = plugs.find((p) => p.name === depName);
                    if (dep) {
                        visit(dep);
                    }
                }
            }

            visiting.delete(plug.name);
            visited.add(plug.name);
            result.push(plug);
        };

        for (const plug of plugs) {
            visit(plug);
        }

        return result;
    }

    /**
     * 注册到全局 window 对象
     */
    private registerToWindow(): void {
        (window as any).PlugManager = this;

        // 创建调试工具
        const debug: PlugDebug = {
            logPlugs: () => {
                console.table(
                    Array.from(this.plugs.values()).map((p) => ({
                        name: p.name,
                        description: p.description,
                        autoInitialize: p.autoInitialize,
                        hasInitialize: !!p.initialize,
                        hasDispose: !!p.dispose,
                    })),
                );
            },
            logStatus: () => {
                console.log("[PlugManager] 状态:", this.getStatus());
            },
            initPlug: (name: string) => this.initializePlug(name),
            disposePlug: (name: string) => this.disposePlug(name),
        };
        (window as any).PlugDebug = debug;
    }

    // ==================== 日志方法 ====================

    private debug(message: string): void {
        if (this.options?.debug) {
            console.debug(message);
        }
    }

    private warn(message: string): void {
        console.warn(message);
    }

    private error(message: string): void {
        console.error(message);
    }
}

// ==================== 导出 ====================

/**
 * 插件管理器单例
 * 在浏览器环境中自动挂载到 window.PlugManager
 */
export const PlugManager = PlugManagerImpl.getInstance();

/**
 * 插件管理器类（用于测试或自定义实例）
 */
export { PlugManagerImpl };

/**
 * 插件入口函数类型
 */
export type PlugEntryFunction = () => PlugExports;

/**
 * 插件系统就绪事件
 * 用于在 DOMContentLoaded 之后自动初始化
 */
export function initializePlugSystem(): void {
    PlugManager.initializeAll();
}

// 自动初始化（如果启用）
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            PlugManager.loadConfigFromUrl("plugins.json");
        });
    } else {
        // DOM 已加载完成
        PlugManager.loadConfigFromUrl("plugins.json");
    }
}

// ==================== 手动挂载到 window ====================
// 使用 IIFE 确保在 ES Module 格式下也能立即执行挂载
(function() {
    if (typeof window !== "undefined") {
        // 挂载 PlugManager 单例
        (window as any).PlugManager = PlugManager;
        
        // 挂载调试工具
        (window as any).PlugDebug = {
            logPlugs: function() {
                console.table(
                    Array.from(PlugManager.getPlugNames()).map(function(name: string) {
                        var plug = PlugManager.getPlug(name);
                        return {
                            name: name,
                            description: plug?.description || "",
                            autoInitialize: plug?.autoInitialize || false,
                            hasInitialize: typeof plug?.initialize === "function",
                            hasDispose: typeof plug?.dispose === "function"
                        };
                    })
                );
            },
            logStatus: function() {
                console.log("[PlugManager] 状态:", PlugManager.getStatus());
            },
            initPlug: function(name: string) {
                return PlugManager.initializePlug(name);
            },
            disposePlug: function(name: string) {
                PlugManager.disposePlug(name);
            }
        };
        
        console.log("[PlugManager] 已手动挂载到 window");
    }
})();
