/**
 * 模块加载器 - 用于动态加载和管理JavaScript模块配置
 * TypeScript版本
 */

// 模块状态枚举
const ModuleState = {
  UNLOADED: "unloaded",
  LOADING: "loading",
  LOADED: "loaded",
  INITIALIZED: "initialized",
  FAILED: "failed",
} as const;

type ModuleStateType = (typeof ModuleState)[keyof typeof ModuleState];

// 模块配置接口
interface ModuleConfig {
  name: string;
  path: string;
  loadOrder: number;
  alwaysLoad?: boolean;
  dependencies?: string[];
  autoInitialize?: boolean;
}

// 模块加载器配置接口
interface ModuleLoaderConfig {
  coreModules: ModuleConfig[];
  featureModules: ModuleConfig[];
}

// 默认模块配置
const defaultModuleConfig: ModuleLoaderConfig = {
  // 基础模块 - 总是加载
  coreModules: [
    {
      name: "interop",
      path: "js/interop.js",
      loadOrder: 1,
      alwaysLoad: true,
    },
    {
      name: "moduleManager",
      path: "js/moduleManager.js",
      loadOrder: 2,
      alwaysLoad: true,
      dependencies: ["interop"],
    },
  ],

  // 功能模块 - 根据需要加载
  featureModules: [
    {
      name: "sidebarDrag",
      path: "js/sidebarDrag.js",
      loadOrder: 3,
      autoInitialize: true,
    },
    {
      name: "themeToggle",
      path: "js/themeToggle.js",
      loadOrder: 4,
      autoInitialize: true,
    },
    // 后续添加新模块只需要在这里配置，不需要修改HTML
  ],
};

// 模块实例接口
interface ModuleInstance {
  name: string;
  path: string;
  loadOrder: number;
  alwaysLoad?: boolean;
  dependencies?: string[];
  autoInitialize?: boolean;
  state: ModuleStateType;
  element: HTMLScriptElement | null;
  error: Error | null;
  loadedAt: Date | null;
  initializedAt: Date | null;
}

// 模块加载结果
interface ModuleLoadResult {
  name: string;
  success: boolean;
  module?: ModuleInstance;
  error?: Error;
}

// 模块加载选项
interface LoadOptions {
  async?: boolean;
  continueOnError?: boolean;
}

// 事件类型
type ModuleLoaderEvent =
  | "moduleRegistered"
  | "moduleLoading"
  | "moduleLoaded"
  | "moduleLoadError"
  | "moduleInitializing"
  | "moduleInitialized"
  | "moduleInitializeError";

// 事件数据接口
interface ModuleEventData {
  name: string;
  config?: ModuleConfig;
  error?: Error;
}

// 全局声明
declare global {
  interface Window {
    ModuleLoader: ModuleLoader;
    ModuleManager?: any;
    loadModule?: (
      name: string,
      options?: LoadOptions,
    ) => Promise<ModuleInstance>;
    loadModules?: (
      names: string[],
      options?: LoadOptions,
    ) => Promise<ModuleLoadResult[]>;
    initializeModule?: (name: string) => boolean;
    initializeAllScripts?: () => Promise<void>;
    cleanupScripts?: (fullCleanup?: boolean) => Promise<void>;
  }
}

// 模块加载器主类
class ModuleLoader {
  private modules: Map<string, ModuleInstance>;
  private loadQueue: string[];
  private isLoading: boolean;
  private config: ModuleLoaderConfig;
  private listeners: Map<
    ModuleLoaderEvent,
    ((data: ModuleEventData) => void)[]
  >;

  constructor(config: ModuleLoaderConfig | null = null) {
    // 模块注册表
    this.modules = new Map();

    // 加载队列
    this.loadQueue = [];

    // 加载中标记
    this.isLoading = false;

    // 配置
    this.config = config || defaultModuleConfig;

    // 事件监听器
    this.listeners = new Map();

    // 初始化
    this._initialize();
  }

  /**
   * 初始化加载器
   */
  private _initialize(): void {
    // 注册核心模块
    this.config.coreModules.forEach((moduleConfig) => {
      this.registerModule(moduleConfig);
    });

    // 注册功能模块
    this.config.featureModules.forEach((moduleConfig) => {
      this.registerModule(moduleConfig);
    });

    console.log(
      `[ModuleLoader] 初始化完成，注册了 ${this.modules.size} 个模块`,
    );
  }

  /**
   * 注册模块（不立即加载）
   */
  public registerModule(config: ModuleConfig): ModuleInstance {
    const module: ModuleInstance = {
      ...config,
      state: ModuleState.UNLOADED,
      element: null,
      error: null,
      loadedAt: null,
      initializedAt: null,
    };

    this.modules.set(module.name, module);

    // 触发事件
    this._emit("moduleRegistered", { name: module.name, config });

    console.log(`[ModuleLoader] 模块注册: ${module.name} (${module.path})`);

    return module;
  }

  /**
   * 加载单个模块
   */
  public async loadModule(
    name: string,
    options: LoadOptions = {},
  ): Promise<ModuleInstance> {
    const module = this.modules.get(name);

    if (!module) {
      console.error(`[ModuleLoader] 模块不存在: ${name}`);
      return Promise.reject(new Error(`Module not found: ${name}`));
    }

    // 如果模块已经加载或正在加载
    if (module.state !== ModuleState.UNLOADED) {
      console.log(
        `[ModuleLoader] 模块 ${name} 状态为 ${module.state}，跳过加载`,
      );
      return Promise.resolve(module);
    }

    // 检查依赖
    if (module.dependencies) {
      const missingDeps = module.dependencies.filter(
        (dep) =>
          !this.modules.has(dep) ||
          this.modules.get(dep)!.state === ModuleState.UNLOADED,
      );

      if (missingDeps.length > 0) {
        console.log(
          `[ModuleLoader] 模块 ${name} 缺少依赖: ${missingDeps.join(", ")}，先加载依赖`,
        );

        // 先加载依赖
        await this.loadDependencies(missingDeps);
        return this._loadModuleScript(module, options);
      }
    }

    return this._loadModuleScript(module, options);
  }

  /**
   * 加载依赖模块
   */
  private async loadDependencies(dependencyNames: string[]): Promise<void> {
    const promises = dependencyNames.map(async (depName) => {
      const depModule = this.modules.get(depName);
      if (depModule && depModule.state === ModuleState.UNLOADED) {
        return this.loadModule(depName);
      }
      return undefined;
    });

    await Promise.all(promises);
  }

  /**
   * 实际加载模块脚本
   */
  private _loadModuleScript(
    module: ModuleInstance,
    options: LoadOptions,
  ): Promise<ModuleInstance> {
    return new Promise((resolve, reject) => {
      module.state = ModuleState.LOADING;
      this._emit("moduleLoading", { name: module.name });

      const script = document.createElement("script");
      script.src = module.path;
      script.async = options.async !== false; // 默认异步加载

      script.onload = () => {
        module.state = ModuleState.LOADED;
        module.element = script;
        module.loadedAt = new Date();

        console.log(`[ModuleLoader] 模块加载成功: ${module.name}`);
        this._emit("moduleLoaded", { name: module.name });

        // 自动初始化
        if (module.autoInitialize !== false) {
          this.initializeModule(module.name);
        }

        resolve(module);
      };

      script.onerror = (error) => {
        module.state = ModuleState.FAILED;
        module.error =
          error instanceof Error ? error : new Error(String(error));

        console.error(`[ModuleLoader] 模块加载失败: ${module.name}`, error);
        this._emit("moduleLoadError", {
          name: module.name,
          error: error instanceof Error ? error : new Error(String(error)),
        });

        reject(error);
      };

      // 添加到页面
      document.head.appendChild(script);
    });
  }

  /**
   * 确保互操作样式被添加到页面
   */
  private _ensureInteropStyles(): void {
    // 检查是否有已存在的样式，如果没有则添加基础样式
    if (!document.getElementById("interop-styles")) {
      const style = document.createElement("style");
      style.id = "interop-styles";
      style.textContent = `
            .interop-hidden {
                display: none !important;
            }
            .interop-visible {
                display: block !important;
            }
        `;
      document.head.appendChild(style);
      console.log("[ModuleLoader] 互操作样式已添加");
    }
  }

  /**
   * 初始化模块
   */
  public initializeModule(name: string): boolean {
    const module = this.modules.get(name);

    if (!module) {
      console.error(`[ModuleLoader] 模块不存在: ${name}`);
      return false;
    }

    // 如果已经初始化
    if (module.state === ModuleState.INITIALIZED) {
      return true;
    }

    // 如果未加载完成
    if (module.state !== ModuleState.LOADED) {
      console.warn(
        `[ModuleLoader] 模块 ${name} 状态为 ${module.state}，无法初始化`,
      );
      return false;
    }

    console.log(`[ModuleLoader] 初始化模块: ${module.name}`);
    this._emit("moduleInitializing", { name: module.name });

    try {
      // 如果是 interop 模块，确保样式被添加
      if (module.name === "interop") {
        this._ensureInteropStyles();
      }

      // 如果模块管理器存在，通过它初始化
      if (window.ModuleManager && window.ModuleManager.hasModule(module.name)) {
        window.ModuleManager.initializeModule(module.name);
      }
      // 否则尝试调用模块特定的初始化函数
      else {
        const initFuncName = `initialize${module.name.charAt(0).toUpperCase() + module.name.slice(1)}`;
        if (
          (window as any)[initFuncName] &&
          typeof (window as any)[initFuncName] === "function"
        ) {
          (window as any)[initFuncName]();
        } else if (module.name !== "interop") {
          // interop模块已经处理了样式，其他模块没有初始化函数时记录日志
          console.log(
            `[ModuleLoader] 模块 ${module.name} 没有找到初始化函数，跳过初始化`,
          );
        }
      }

      module.state = ModuleState.INITIALIZED;
      module.initializedAt = new Date();

      this._emit("moduleInitialized", { name: module.name });
      console.log(`[ModuleLoader] 模块初始化成功: ${module.name}`);

      return true;
    } catch (error) {
      module.state = ModuleState.FAILED;
      module.error = error instanceof Error ? error : new Error(String(error));

      console.error(`[ModuleLoader] 模块初始化失败: ${module.name}`, error);
      this._emit("moduleInitializeError", {
        name: module.name,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      return false;
    }
  }

  /**
   * 批量加载模块
   */
  public async loadModules(
    moduleNames: string[],
    options: LoadOptions = {},
  ): Promise<ModuleLoadResult[]> {
    // 过滤出未加载的模块
    const modulesToLoad = moduleNames.filter((name) => {
      const module = this.modules.get(name);
      return module && module.state === ModuleState.UNLOADED;
    });

    if (modulesToLoad.length === 0) {
      console.log("[ModuleLoader] 没有需要加载的模块");
      return Promise.resolve([]);
    }

    console.log(
      `[ModuleLoader] 开始批量加载 ${modulesToLoad.length} 个模块:`,
      modulesToLoad,
    );

    // 计算加载顺序
    const sortedModules = this._sortModulesByDependencies(modulesToLoad);

    // 依次加载
    const results: ModuleLoadResult[] = [];
    let promiseChain = Promise.resolve();

    sortedModules.forEach((moduleName) => {
      promiseChain = promiseChain.then((): Promise<ModuleInstance | null> => {
        return this.loadModule(moduleName, options).then(
          (module) => {
            results.push({ name: moduleName, success: true, module });
            return module;
          },
          (error) => {
            results.push({
              name: moduleName,
              success: false,
              error: error instanceof Error ? error : new Error(String(error)),
            });

            // 如果配置了 continueOnError，则继续加载下一个
            if (options.continueOnError) {
              return Promise.resolve(null);
            }

            // 否则抛出错误
            return Promise.reject(error);
          },
        );
      }) as Promise<void>;
    });

    return promiseChain.then(() => {
      console.log("[ModuleLoader] 批量加载完成");
      return results;
    });
  }

  /**
   * 根据依赖关系排序模块
   */
  private _sortModulesByDependencies(moduleNames: string[]): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>(); // 用于检测循环依赖

    const visit = (name: string) => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`循环依赖检测到: ${name}`);
      }

      const module = this.modules.get(name);
      if (!module) return;

      visiting.add(name);

      // 先访问依赖
      if (module.dependencies) {
        module.dependencies.forEach((dep) => {
          if (moduleNames.includes(dep)) {
            visit(dep);
          }
        });
      }

      visiting.delete(name);
      visited.add(name);
      sorted.push(name);
    };

    moduleNames.forEach(visit);
    return sorted;
  }

  /**
   * 自动加载所有模块
   */
  public async autoLoadAll(options: LoadOptions = {}): Promise<void> {
    // 先加载核心模块
    const coreModuleNames = this.config.coreModules.map((m) => m.name);

    await this.loadModules(coreModuleNames, options);

    // 然后加载功能模块
    const featureModuleNames = this.config.featureModules.map((m) => m.name);
    await this.loadModules(featureModuleNames, options);
  }

  /**
   * 获取模块信息
   */
  public getModuleInfo(name: string): any | null {
    const module = this.modules.get(name);
    if (!module) return null;

    return {
      name: module.name,
      path: module.path,
      state: module.state,
      dependencies: module.dependencies || [],
      autoInitialize: module.autoInitialize,
      loadedAt: module.loadedAt,
      initializedAt: module.initializedAt,
      error: module.error,
    };
  }

  /**
   * 获取所有模块信息
   */
  public getAllModulesInfo(): any[] {
    const result: any[] = [];
    this.modules.forEach((module) => {
      result.push(this.getModuleInfo(module.name));
    });

    // 按加载顺序排序
    return result.sort((a, b) => {
      const aOrder = this._getModuleLoadOrder(a.name);
      const bOrder = this._getModuleLoadOrder(b.name);
      return aOrder - bOrder;
    });
  }

  /**
   * 获取模块加载顺序
   */
  private _getModuleLoadOrder(name: string): number {
    const allModules = [
      ...this.config.coreModules,
      ...this.config.featureModules,
    ];
    const module = allModules.find((m) => m.name === name);
    return module ? module.loadOrder : 999;
  }

  /**
   * 检查模块是否已加载
   */
  public isModuleLoaded(name: string): boolean {
    const module = this.modules.get(name);
    return !!module && module.state !== ModuleState.UNLOADED;
  }

  /**
   * 检查模块是否已初始化
   */
  public isModuleInitialized(name: string): boolean {
    const module = this.modules.get(name);
    return !!module && module.state === ModuleState.INITIALIZED;
  }

  /**
   * 添加事件监听器
   */
  public on(
    eventName: ModuleLoaderEvent,
    callback: (data: ModuleEventData) => void,
  ): this {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(callback);
    return this;
  }

  /**
   * 移除事件监听器
   */
  public off(
    eventName: ModuleLoaderEvent,
    callback: (data: ModuleEventData) => void,
  ): this {
    if (!this.listeners.has(eventName)) return this;

    const callbacks = this.listeners.get(eventName)!;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }

    return this;
  }

  /**
   * 触发事件
   */
  private _emit(eventName: ModuleLoaderEvent, data: ModuleEventData): void {
    if (!this.listeners.has(eventName)) return;

    const callbacks = this.listeners.get(eventName)!;
    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[ModuleLoader] 事件监听器错误 (${eventName}):`, error);
      }
    });
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<ModuleLoaderConfig>): void {
    // 合并配置
    this.config = {
      coreModules: [...this.config.coreModules],
      featureModules: [
        ...this.config.featureModules,
        ...(newConfig.featureModules || []),
      ],
    };

    // 注册新模块
    if (newConfig.featureModules) {
      newConfig.featureModules.forEach((moduleConfig) => {
        if (!this.modules.has(moduleConfig.name)) {
          this.registerModule(moduleConfig);
        }
      });
    }

    console.log("[ModuleLoader] 配置已更新");
  }
}

// 全局辅助函数
function setupGlobalModuleLoader(): void {
  // 创建全局实例
  if (!window.ModuleLoader) {
    window.ModuleLoader = new ModuleLoader();

    // 全局辅助函数
    window.loadModule = function (
      name: string,
      options: LoadOptions = {},
    ): Promise<ModuleInstance> {
      return window.ModuleLoader.loadModule(name, options);
    };

    window.loadModules = function (
      names: string[],
      options: LoadOptions = {},
    ): Promise<ModuleLoadResult[]> {
      return window.ModuleLoader.loadModules(names, options);
    };

    window.initializeModule = function (name: string): boolean {
      return window.ModuleLoader.initializeModule(name);
    };

    window.initializeAllScripts = function (): Promise<void> {
      console.log("[ModuleLoader] Initializing all scripts...");
      return window.ModuleLoader.autoLoadAll({
        async: true,
        continueOnError: true,
      });
    };

    window.cleanupScripts = function (fullCleanup = false): Promise<void> {
      console.log("[ModuleLoader] Cleaning up scripts...");
      // 清理全局状态
      document.documentElement.removeAttribute("data-theme");
      if (fullCleanup) {
        localStorage.removeItem("theme");
      }
      // 注意：模块清理由各模块自己处理
      // 如果ModuleManager存在，可以调用它的disposeAllModules
      if (
        window.ModuleManager &&
        typeof window.ModuleManager.disposeAllModules === "function"
      ) {
        return window.ModuleManager.disposeAllModules();
      }
      return Promise.resolve();
    };

    // 自动加载配置 - 默认禁用，由Blazor的JsInteropService控制
    // 通过设置data-auto-load-modules="true"可以启用自动加载
    document.addEventListener("DOMContentLoaded", function () {
      const autoLoad = document.body.dataset.autoLoadModules === "true";

      if (autoLoad) {
        console.log("[ModuleLoader] 开始自动加载模块...");
        window.ModuleLoader.autoLoadAll({
          async: true,
          continueOnError: true,
        })
          .then(() => {
            console.log("[ModuleLoader] 所有模块自动加载完成");
          })
          .catch((error) => {
            console.error("[ModuleLoader] 自动加载失败:", error);
          });
      } else {
        console.log(
          "[ModuleLoader] 自动加载已禁用，将通过JsInteropService手动初始化",
        );
      }
    });

    console.log("[ModuleLoader] 全局模块加载器已初始化");
  }
}

// 初始化全局模块加载器
if (typeof window !== "undefined") {
  setupGlobalModuleLoader();
}

// 导出类、接口和常量
export {
  ModuleLoader,
  ModuleState,
  type ModuleStateType,
  type ModuleConfig,
  type ModuleLoaderConfig,
  type ModuleInstance,
  type ModuleLoadResult,
  type LoadOptions,
  type ModuleLoaderEvent,
  type ModuleEventData,
  defaultModuleConfig,
};
