using Microsoft.JSInterop;

namespace AW.Client.Services
{
    /// <summary>
    /// 插件服务接口，用于调用TypeScript插件系统
    /// </summary>
    public interface IPluginService
    {
        /// <summary>
        /// 调用插件方法（无返回值）
        /// </summary>
        /// <param name="pluginName">插件名称</param>
        /// <param name="methodName">方法名</param>
        /// <param name="args">参数</param>
        Task InvokeVoidAsync(string pluginName, string methodName, params object?[] args);
        
        /// <summary>
        /// 调用插件方法（有返回值）
        /// </summary>
        /// <typeparam name="TValue">返回值类型</typeparam>
        /// <param name="pluginName">插件名称</param>
        /// <param name="methodName">方法名</param>
        /// <param name="args">参数</param>
        /// <returns>返回值</returns>
        Task<TValue> InvokeAsync<TValue>(string pluginName, string methodName, params object?[] args);
        
        /// <summary>
        /// 直接调用全局函数（无返回值）
        /// </summary>
        /// <param name="functionName">函数名（支持点号路径）</param>
        /// <param name="args">参数</param>
        Task InvokeGlobalVoidAsync(string functionName, params object?[] args);
        
        /// <summary>
        /// 直接调用全局函数（有返回值）
        /// </summary>
        /// <typeparam name="TValue">返回值类型</typeparam>
        /// <param name="functionName">函数名（支持点号路径）</param>
        /// <param name="args">参数</param>
        /// <returns>返回值</returns>
        Task<TValue> InvokeGlobalAsync<TValue>(string functionName, params object?[] args);
        
        /// <summary>
        /// 检查插件是否存在
        /// </summary>
        /// <param name="pluginName">插件名称</param>
        /// <returns>是否存在</returns>
        Task<bool> PluginExistsAsync(string pluginName);
        
        /// <summary>
        /// 检查插件方法是否存在
        /// </summary>
        /// <param name="pluginName">插件名称</param>
        /// <param name="methodName">方法名</param>
        /// <returns>是否存在</returns>
        Task<bool> MethodExistsAsync(string pluginName, string methodName);
    }
}