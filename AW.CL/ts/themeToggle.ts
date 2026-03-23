/**
 * 主题切换
 */
export function initThemeToggle(): void {
  try {
    const themeToggle = document.querySelector<HTMLElement>(".theme-toggle");
    const root = document.documentElement;

    if (!themeToggle) {
      console.error("Theme toggle button not found.");
      return;
    }

    type ThemePreference = "dark" | "light" | "system";
    const savedTheme: ThemePreference =
      (localStorage.getItem("theme") as ThemePreference) || "system";

    if (savedTheme === "system") {
      const isDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.dataset.theme = isDarkMode ? "dark" : "light";
    } else {
      root.dataset.theme = savedTheme;
    }

    themeToggle.addEventListener("click", () => {
      const currentTheme = root.dataset.theme || "light";
      const newTheme: "dark" | "light" =
        currentTheme === "dark" ? "light" : "dark";

      root.dataset.theme = newTheme;
      localStorage.setItem("theme", newTheme);
    });
  } catch (error) {
    console.error("Failed to initialize theme toggle:", error);
  }
}

/**
 * 插件导出函数
 * 遵循 Plug 系统的约定接口
 */
function getExports() {
    return {
        name: "themeToggle",
        description: "主题切换功能插件",
        exports: {
            initThemeToggle: initThemeToggle,
        },
        initialize: () => {
            initThemeToggle();
        },
        dispose: () => {
            document.documentElement.removeAttribute("data-theme");
        },
        autoInitialize: true,
    };
}

// 导出插件入口函数
export { getExports };

// 立即执行并注册到 PlugManager（如果已加载）
if (typeof window !== "undefined") {
    const exports = getExports();
    const plugManager = (window as any).PlugManager;
    if (plugManager && typeof plugManager.registerPlug === "function") {
        plugManager.registerPlug(exports);
    } else {
        // 如果 PlugManager 尚未加载，稍后手动初始化
        (window as any).__pendingPlugs = (window as any).__pendingPlugs || [];
        (window as any).__pendingPlugs.push(exports);
    }
}
