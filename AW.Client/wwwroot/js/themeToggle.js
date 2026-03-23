export function initThemeToggle() {
    try {
        const themeToggle = document.querySelector(".theme-toggle");
        const root = document.documentElement;
        if (!themeToggle) {
            console.error("Theme toggle button not found.");
            return;
        }
        const savedTheme = localStorage.getItem("theme") || "system";
        if (savedTheme === "system") {
            const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
            root.dataset.theme = isDarkMode ? "dark" : "light";
        }
        else {
            root.dataset.theme = savedTheme;
        }
        themeToggle.addEventListener("click", () => {
            const currentTheme = root.dataset.theme || "light";
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            root.dataset.theme = newTheme;
            localStorage.setItem("theme", newTheme);
        });
    }
    catch (error) {
        console.error("Failed to initialize theme toggle:", error);
    }
}
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
export { getExports };
if (typeof window !== "undefined") {
    const exports = getExports();
    const plugManager = window.PlugManager;
    if (plugManager && typeof plugManager.registerPlug === "function") {
        plugManager.registerPlug(exports);
    }
    else {
        window.__pendingPlugs = window.__pendingPlugs || [];
        window.__pendingPlugs.push(exports);
    }
}
//# sourceMappingURL=themeToggle.js.map