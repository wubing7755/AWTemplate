/**
 * 插件系统类型定义
 * 遵循 TypeScript 最佳实践，提供完整的类型安全
 */

/**
 * 插件导出接口 - 每个插件必须实现此接口
 * 类似于 VSCode 插件的 package.json main 入口
 */
export interface PlugExports {
    /** 插件唯一标识 */
    name: string;
    /** 插件描述 */
    description?: string;
    /** 需要挂载到 window 的对象集合 */
    exports: Record<string, unknown>;
    /** 初始化函数 */
    initialize?: () => void | Promise<void>;
    /** 销毁/清理函数 */
    dispose?: () => void;
    /** 是否自动初始化 */
    autoInitialize?: boolean;
}

/**
 * 插件配置项 - plugins.json 中的每一项
 */
export interface PlugConfig {
    /** 插件名称 */
    name: string;
    /** JS 文件路径 */
    file: string;
    /** 入口函数名（获取插件导出） */
    entry: string;
    /** 是否自动初始化 */
    autoInitialize?: boolean;
    /** 描述 */
    description?: string;
    /** 依赖的其他插件 */
    dependsOn?: string[];
}

/**
 * 插件配置集合
 */
export interface PlugsConfig {
    /** 插件列表（按顺序加载） */
    plugs: PlugConfig[];
    /** 全局配置 */
    options?: PlugsOptions;
}

/**
 * 插件系统全局配置
 */
export interface PlugsOptions {
    /** 是否开启调试模式 */
    debug?: boolean;
    /** 是否在 DOMContentLoaded 时自动加载 */
    loadOnDomContentLoaded?: boolean;
    /** 插件配置文件路径 */
    configPath?: string;
}

/**
 * 插件注册选项
 */
export interface PlugRegisterOptions {
    /** 插件导出对象 */
    plug: PlugExports;
    /** 是否立即初始化 */
    immediate?: boolean;
}

/**
 * 插件初始化结果
 */
export interface PlugInitResult {
    /** 插件名称 */
    name: string;
    /** 是否成功 */
    success: boolean;
    /** 错误信息 */
    error?: string;
    /** 耗时（毫秒） */
    duration?: number;
}

/**
 * 插件管理器接口
 * 定义插件管理器的核心能力
 */
export interface IPlugManager {
    /** 注册插件 */
    registerPlug(plug: PlugExports): void;
    /** 获取插件 */
    getPlug<T = PlugExports>(name: string): T | undefined;
    /** 检查插件是否存在 */
    hasPlug(name: string): boolean;
    /** 获取所有插件名称 */
    getPlugNames(): string[];
    /** 初始化所有插件 */
    initializeAll(): Promise<PlugInitResult[]>;
    /** 初始化指定插件 */
    initializePlug(name: string): Promise<PlugInitResult>;
    /** 销毁所有插件 */
    disposeAll(): void;
    /** 销毁指定插件 */
    disposePlug(name: string): void;
    /** 加载插件配置并初始化 */
    loadFromConfig(config: PlugsConfig): Promise<PlugInitResult[]>;
    /** 从远程配置加载 */
    loadConfigFromUrl(url: string): Promise<PlugInitResult[]>;
}

/**
 * 全局调试工具类型
 */
export interface PlugDebug {
    /** 打印所有已注册的插件 */
    logPlugs: () => void;
    /** 打印插件管理器状态 */
    logStatus: () => void;
    /** 手动触发插件初始化 */
    initPlug: (name: string) => Promise<PlugInitResult>;
    /** 手动销毁插件 */
    disposePlug: (name: string) => void;
}
