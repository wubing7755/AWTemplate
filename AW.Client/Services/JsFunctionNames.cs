using System;

namespace AW.Client.Services
{
    /// <summary>
    /// JavaScript 函数名常量
    /// 集中管理所有 JavaScript 互操作函数名称，避免硬编码
    /// </summary>
    public static class JsFunctionNames
    {
        // 模块加载器相关函数
        public const string InitializeAllScripts = "initializeAllScripts";
        public const string CleanupScripts = "cleanupScripts";
        public const string LoadModule = "loadModule";
        public const string LoadModules = "loadModules";
        public const string InitializeModule = "initializeModule";

        // DOM 操作相关函数
        public const string AddClass = "addClass";
        public const string RemoveClass = "removeClass";
        public const string ToggleClass = "toggleClass";
        public const string ShowElement = "showElement";
        public const string HideElement = "hideElement";

        // 用户界面相关函数
        public const string ShowToast = "showToast";
        public const string ShowConfirm = "showConfirm";
        public const string ShowPrompt = "showPrompt";

        // 滚动和窗口操作函数
        public const string GetScrollPosition = "getScrollPosition";
        public const string ScrollToPosition = "scrollToPosition";
        public const string ScrollToElement = "scrollToElement";
        public const string GetWindowSize = "getWindowSize";

        // 工具函数
        public const string CopyToClipboard = "copyToClipboard";

        // 主题相关函数
        public const string InitThemeToggle = "initThemeToggle";

        // 拖拽管理器相关函数
        public static class DragManager
        {
            public const string Init = "DragManager.init";
            public const string Destroy = "DragManager.destroy";
        }
    }
}
