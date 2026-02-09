using Microsoft.JSInterop;

namespace AW.Client.Services
{
    /// <summary>
    /// 提供 JavaScript 互操作服务的接口
    /// </summary>
    public interface IJsInteropService
    {
        /// <summary>
        /// 调用 JavaScript 函数并返回结果
        /// </summary>
        /// <typeparam name="TValue">返回值的类型</typeparam>
        /// <param name="identifier">JavaScript 函数标识符（全局函数名或 module.function）</param>
        /// <param name="args">传递给 JavaScript 函数的参数</param>
        /// <returns>JavaScript 函数的返回值</returns>
        ValueTask<TValue> InvokeAsync<TValue>(string identifier, params object?[]? args);

        /// <summary>
        /// 调用不返回值的 JavaScript 函数
        /// </summary>
        /// <param name="identifier">JavaScript 函数标识符（全局函数名或 module.function）</param>
        /// <param name="args">传递给 JavaScript 函数的参数</param>
        ValueTask InvokeVoidAsync(string identifier, params object?[]? args);

        /// <summary>
        /// 导入 JavaScript 模块
        /// </summary>
        /// <param name="modulePath">模块路径</param>
        /// <returns>JavaScript 模块引用</returns>
        ValueTask<IJSObjectReference> ImportModuleAsync(string modulePath);

        /// <summary>
        /// 调用 JavaScript 模块中的函数并返回结果
        /// </summary>
        /// <typeparam name="TValue">返回值的类型</typeparam>
        /// <param name="module">JavaScript 模块引用</param>
        /// <param name="functionName">模块中的函数名</param>
        /// <param name="args">传递给函数的参数</param>
        /// <returns>JavaScript 函数的返回值</returns>
        ValueTask<TValue> InvokeModuleAsync<TValue>(IJSObjectReference module, string functionName, params object?[]? args);

        /// <summary>
        /// 调用 JavaScript 模块中的不返回值函数
        /// </summary>
        /// <param name="module">JavaScript 模块引用</param>
        /// <param name="functionName">模块中的函数名</param>
        /// <param name="args">传递给函数的参数</param>
        ValueTask InvokeModuleVoidAsync(IJSObjectReference module, string functionName, params object?[]? args);

        /// <summary>
        /// 清理脚本功能
        /// </summary>
        /// <param name="fullCleanup">是否完全清理（包括 localStorage 中的主题设置）</param>
        ValueTask CleanupScriptsAsync(bool fullCleanup = false);
    }
}
