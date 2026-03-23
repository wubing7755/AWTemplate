using Microsoft.JSInterop;

namespace AW.Client.Services
{
    /// <summary>
    /// 插件服务接口
    /// 提供与 TypeScript 插件系统交互的统一入口
    /// 遵循依赖倒置原则，便于测试和扩展
    /// </summary>
    public interface IPluginService
    {
        // ==================== 生命周期管理 ====================

        /// <summary>
        /// 初始化插件系统
        /// 加载配置文件并初始化所有插件
        /// </summary>
        /// <param name="configPath">配置文件路径（可选，默认 plugins.json）</param>
        /// <returns>初始化结果</returns>
        Task<PlugInitResult[]> InitializeAsync(string? configPath = null);

        /// <summary>
        /// 初始化指定插件
        /// </summary>
        /// <param name="plugName">插件名称</param>
        /// <returns>初始化结果</returns>
        Task<PlugInitResult> InitializePlugAsync(string plugName);

        /// <summary>
        /// 销毁指定插件
        /// </summary>
        /// <param name="plugName">插件名称</param>
        Task DisposePlugAsync(string plugName);

        /// <summary>
        /// 销毁所有插件
        /// </summary>
        Task DisposeAllAsync();

        // ==================== 插件信息查询 ====================

        /// <summary>
        /// 检查插件是否存在
        /// </summary>
        /// <param name="plugName">插件名称</param>
        /// <returns>是否存在</returns>
        Task<bool> HasPlugAsync(string plugName);

        /// <summary>
        /// 获取所有已注册的插件信息
        /// </summary>
        /// <returns>插件信息列表</returns>
        Task<IReadOnlyList<PlugInfo>> GetPlugInfosAsync();

        /// <summary>
        /// 获取插件管理器状态
        /// </summary>
        /// <returns>状态信息</returns>
        Task<PlugManagerStatus> GetStatusAsync();

        // ==================== 插件方法调用 ====================

        /// <summary>
        /// 调用插件的初始化方法（无返回值）
        /// </summary>
        /// <param name="plugName">插件名称</param>
        /// <param name="methodName">方法名（默认 initialize）</param>
        /// <param name="args">参数</param>
        Task InvokePlugVoidAsync(string plugName, string methodName = "initialize", params object?[] args);

        /// <summary>
        /// 调用插件方法（有返回值）
        /// </summary>
        /// <typeparam name="TValue">返回值类型</typeparam>
        /// <param name="plugName">插件名称</param>
        /// <param name="methodName">方法名</param>
        /// <param name="args">参数</param>
        /// <returns>返回值</returns>
        Task<TValue?> InvokePlugAsync<TValue>(string plugName, string methodName, params object?[] args);

        /// <summary>
        /// 调用插件的销毁方法
        /// </summary>
        /// <param name="plugName">插件名称</param>
        Task InvokeDisposeAsync(string plugName);

        // ==================== 动态调用 ====================

        /// <summary>
        /// 从 window 对象直接调用方法（适用于 exports 中的函数）
        /// </summary>
        /// <typeparam name="TValue">返回值类型</typeparam>
        /// <param name="objectName">对象名称（window 上的属性名）</param>
        /// <param name="methodName">方法名</param>
        /// <param name="args">参数</param>
        /// <returns>返回值</returns>
        Task<TValue?> InvokeWindowAsync<TValue>(string objectName, string methodName, params object?[] args);

        /// <summary>
        /// 从 window 对象直接调用方法（无返回值）
        /// </summary>
        /// <param name="objectName">对象名称</param>
        /// <param name="methodName">方法名</param>
        /// <param name="args">参数</param>
        Task InvokeWindowVoidAsync(string objectName, string methodName, params object?[] args);
    }

    /// <summary>
    /// 插件信息
    /// </summary>
    public class PlugInfo
    {
        /// <summary>
        /// 插件名称
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 插件描述
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// 是否自动初始化
        /// </summary>
        public bool AutoInitialize { get; set; }

        /// <summary>
        /// 是否有初始化函数
        /// </summary>
        public bool HasInitialize { get; set; }

        /// <summary>
        /// 是否有销毁函数
        /// </summary>
        public bool HasDispose { get; set; }
    }

    /// <summary>
    /// 插件初始化结果
    /// </summary>
    public class PlugInitResult
    {
        /// <summary>
        /// 插件名称
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 是否成功
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// 错误信息
        /// </summary>
        public string? Error { get; set; }

        /// <summary>
        /// 耗时（毫秒）
        /// </summary>
        public int? Duration { get; set; }
    }

    /// <summary>
    /// 插件管理器状态
    /// </summary>
    public class PlugManagerStatus
    {
        /// <summary>
        /// 是否已初始化
        /// </summary>
        public bool Initialized { get; set; }

        /// <summary>
        /// 是否正在加载
        /// </summary>
        public bool Loading { get; set; }

        /// <summary>
        /// 插件数量
        /// </summary>
        public int PlugCount { get; set; }

        /// <summary>
        /// 插件名称列表
        /// </summary>
        public List<string> Plugs { get; set; } = new();
    }
}
