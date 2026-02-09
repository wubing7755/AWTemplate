/**
 * 模块管理器 - 用于集中管理和初始化JavaScript模块
 * TypeScript版本
 */

// 模块状态枚举
const ModuleState = {
  REGISTERED: "registered",
  INITIALIZING: "initializing",
  INITIALIZED: "initialized",
  FAILED: "failed",
  DISPOSED: "disposed",
} as const;

type ModuleStateType = (typeof ModuleState)[keyof typeof ModuleState];

// 模块定义接口
interface ModuleDefinition {
  initialize?: () => Promise<void> | void;
  dispose?: () => Promise<void> | void;
  dependencies?: string[];
  description?: string;
  autoInitialize?: boolean;
}

// 模块管理器配置
interface ModuleManagerConfig {
  autoInitialize: boolean;
  logLevel: "debug" | "info" | "warn" | "error" | "silent";
  dependencyCheck: boolean;
}

// 模块信息接口
interface ModuleInfo {
  name: string;
  state: ModuleStateType;
  hasInitialize: boolean;
  hasDispose: boolean;
  dependencies: string[];
  description: string;
  error: Error | null;
  initializedAt: Date | null;
}

// 模块初始化结果
interface ModuleInitializationResults {
  success: string[];
  failed: string[];
  skipped: string[];
}

// 模块类
class Module {
  public name: string;
  public definition: ModuleDefinition;
  public state: ModuleStateType;
  public dependenciesResolved: boolean;
  public error: Error | null;
  public initializedAt: Date | null;

  constructor(name: string, definition: ModuleDefinition) {
    this.name = name;
    this.definition = definition;
    this.state = ModuleState.REGISTERED;
    this.dependenciesResolved = false;
    this.error = null;
    this.initializedAt = null;
  }

  async initialize(): Promise<boolean> {
    if (this.state === ModuleState.INITIALIZED) {
      log("debug", `Module "${this.name}" already initialized`);
      return true;
    }

    if (this.state === ModuleState.INITIALIZING) {
      log("warn", `Module "${this.name}" is already initializing`);
      return false;
    }

    this.state = ModuleState.INITIALIZING;

    try {
      // 检查依赖
      if (config.dependencyCheck && this.definition.dependencies) {
        const missingDeps = this.definition.dependencies.filter(
          (dep) =>
            !modules.has(dep) ||
            modules.get(dep)!.state !== ModuleState.INITIALIZED,
        );

        if (missingDeps.length > 0) {
          throw new Error(
            `Missing or uninitialized dependencies: ${missingDeps.join(", ")}`,
          );
        }
      }

      log("info", `Initializing module "${this.name}"...`);

      // 执行初始化函数
      if (typeof this.definition.initialize === "function") {
        await this.definition.initialize();
      }

      this.state = ModuleState.INITIALIZED;
      this.initializedAt = new Date();
      log("info", `Module "${this.name}" initialized successfully`);

      return true;
    } catch (error) {
      this.state = ModuleState.FAILED;
      this.error = error instanceof Error ? error : new Error(String(error));
      log("error", `Failed to initialize module "${this.name}":`, error);
      return false;
    }
  }

  async dispose(): Promise<void> {
    if (this.state === ModuleState.DISPOSED) {
      return;
    }

    try {
      log("info", `Disposing module "${this.name}"...`);

      if (typeof this.definition.dispose === "function") {
        await this.definition.dispose();
      }

      this.state = ModuleState.DISPOSED;
      log("info", `Module "${this.name}" disposed`);
    } catch (error) {
      log("error", `Error disposing module "${this.name}":`, error);
    }
  }

  getInfo(): ModuleInfo {
    return {
      name: this.name,
      state: this.state,
      hasInitialize: typeof this.definition.initialize === "function",
      hasDispose: typeof this.definition.dispose === "function",
      dependencies: this.definition.dependencies || [],
      description: this.definition.description || "",
      error: this.error,
      initializedAt: this.initializedAt,
    };
  }
}

// 全局变量
const modules = new Map<string, Module>();
const defaultConfig: ModuleManagerConfig = {
  autoInitialize: true,
  logLevel: "info",
  dependencyCheck: true,
};

let config: ModuleManagerConfig = { ...defaultConfig };

// 日志函数
function log(
  level: "debug" | "info" | "warn" | "error",
  message: string,
  ...args: any[]
): void {
  const levels = ["debug", "info", "warn", "error"];
  const currentLevelIndex = levels.indexOf(config.logLevel);
  const messageLevelIndex = levels.indexOf(level);

  if (messageLevelIndex < currentLevelIndex) {
    return;
  }

  const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
  const prefix = `[ModuleManager ${timestamp}]`;

  switch (level) {
    case "debug":
      console.debug(prefix, message, ...args);
      break;
    case "info":
      console.info(prefix, message, ...args);
      break;
    case "warn":
      console.warn(prefix, message, ...args);
      break;
    case "error":
      console.error(prefix, message, ...args);
      break;
  }
}

// 模块管理器主对象
const ModuleManager = {
  /**
   * 配置模块管理器
   * @param newConfig - 新配置
   */
  configure(newConfig: Partial<ModuleManagerConfig>): void {
    config = { ...config, ...newConfig };
    log("info", "ModuleManager configured:", config);
  },

  /**
   * 注册模块
   * @param name - 模块名称
   * @param definition - 模块定义
   * @returns 是否注册成功
   */
  registerModule(name: string, definition: ModuleDefinition): boolean {
    if (!name || typeof name !== "string") {
      log("error", "Module name must be a non-empty string");
      return false;
    }

    if (modules.has(name)) {
      log("warn", `Module "${name}" is already registered`);
      return false;
    }

    if (!definition || typeof definition !== "object") {
      log("error", "Module definition must be an object");
      return false;
    }

    // 验证定义
    if (definition.initialize && typeof definition.initialize !== "function") {
      log("error", "Module initialize must be a function");
      return false;
    }

    if (definition.dispose && typeof definition.dispose !== "function") {
      log("error", "Module dispose must be a function");
      return false;
    }

    if (definition.dependencies && !Array.isArray(definition.dependencies)) {
      log("error", "Module dependencies must be an array");
      return false;
    }

    const module = new Module(name, definition);
    modules.set(name, module);

    log("info", `Module "${name}" registered`);

    // 自动初始化
    if (config.autoInitialize && definition.autoInitialize !== false) {
      setTimeout(() => this.initializeModule(name), 0);
    }

    return true;
  },

  /**
   * 初始化单个模块
   * @param name - 模块名称
   * @returns 是否初始化成功
   */
  async initializeModule(name: string): Promise<boolean> {
    const module = modules.get(name);

    if (!module) {
      log("error", `Module "${name}" not found`);
      return false;
    }

    return await module.initialize();
  },

  /**
   * 初始化所有模块
   * @param moduleOrder - 可选的模块初始化顺序（默认按注册顺序）
   * @returns 初始化结果
   */
  async initializeAllModules(
    moduleOrder: string[] | null = null,
  ): Promise<ModuleInitializationResults> {
    log("info", "Initializing all modules...");

    const moduleNames = moduleOrder || Array.from(modules.keys());
    const results: ModuleInitializationResults = {
      success: [],
      failed: [],
      skipped: [],
    };

    for (const name of moduleNames) {
      const module = modules.get(name);

      if (!module) {
        log("warn", `Module "${name}" not found, skipping`);
        results.skipped.push(name);
        continue;
      }

      if (module.state === ModuleState.INITIALIZED) {
        results.success.push(name);
        continue;
      }

      const success = await this.initializeModule(name);

      if (success) {
        results.success.push(name);
      } else {
        results.failed.push(name);
      }
    }

    log(
      "info",
      `Modules initialized: ${results.success.length} success, ${results.failed.length} failed, ${results.skipped.length} skipped`,
    );

    return results;
  },

  /**
   * 清理所有模块
   */
  async disposeAllModules(): Promise<void> {
    log("info", "Disposing all modules...");

    // 按初始化顺序反向清理
    const modulesArray = Array.from(modules.values());
    modulesArray.sort(
      (a, b) =>
        (b.initializedAt?.getTime() || 0) - (a.initializedAt?.getTime() || 0),
    );

    for (const module of modulesArray) {
      await module.dispose();
    }

    log("info", "All modules disposed");
  },

  /**
   * 获取模块信息
   * @param name - 模块名称
   * @returns 模块信息或null
   */
  getModuleInfo(name: string): ModuleInfo | null {
    const module = modules.get(name);
    return module ? module.getInfo() : null;
  },

  /**
   * 获取所有模块信息
   * @returns 所有模块信息
   */
  getAllModulesInfo(): ModuleInfo[] {
    return Array.from(modules.values()).map((module) => module.getInfo());
  },

  /**
   * 检查模块是否存在
   * @param name - 模块名称
   * @returns 是否存在
   */
  hasModule(name: string): boolean {
    return modules.has(name);
  },

  /**
   * 获取模块状态
   * @param name - 模块名称
   * @returns 模块状态或null
   */
  getModuleState(name: string): ModuleStateType | null {
    const module = modules.get(name);
    return module ? module.state : null;
  },

  /**
   * 卸载模块
   * @param name - 模块名称
   */
  unregisterModule(name: string): void {
    if (modules.has(name)) {
      const module = modules.get(name)!;
      if (module.state !== ModuleState.DISPOSED) {
        module.dispose();
      }
      modules.delete(name);
      log("info", `Module "${name}" unregistered`);
    }
  },

  /**
   * 重置模块管理器（用于测试）
   */
  reset(): void {
    modules.clear();
    config = { ...defaultConfig };
    log("info", "ModuleManager reset");
  },
};

// 导出类型和常量
export {
  ModuleManager,
  ModuleState,
  type ModuleDefinition,
  type ModuleManagerConfig,
  type ModuleInfo,
  type ModuleInitializationResults,
};

// 附加到window对象全局可用
if (typeof window !== "undefined") {
  (window as any).ModuleManager = ModuleManager;
}
