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

// 附加到window对象全局可用
(window as any).initThemeToggle = initThemeToggle;

// 注册到模块管理器
if ((window as any).ModuleManager) {
  (window as any).ModuleManager.registerModule("themeToggle", {
    description: "主题切换功能模块",
    initialize: function (): void {
      console.log("[ModuleManager] Initializing themeToggle module");
      (window as any).initThemeToggle();
    },
    dispose: function (): void {
      console.log("[ModuleManager] Disposing themeToggle module");
      document.documentElement.removeAttribute("data-theme");
    },
    autoInitialize: true,
  });
} else {
  console.warn("ModuleManager not found, initializing themeToggle directly");
  (window as any).initThemeToggle();
}
