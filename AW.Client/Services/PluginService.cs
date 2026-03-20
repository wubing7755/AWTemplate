using Microsoft.JSInterop;
using System.Text.Json;

namespace AW.Client.Services
{
    /// <summary>
    /// 插件服务实现，通过IJSRuntime调用TypeScript插件系统
    /// </summary>
    public class PluginService : IPluginService
    {
        private readonly IJSRuntime _jsRuntime;
        private IJSObjectReference? _module;
        private bool _isInitialized = false;
        
        public PluginService(IJSRuntime jsRuntime)
        {
            _jsRuntime = jsRuntime;
        }
        
        /// <summary>
        /// 确保插件系统已初始化
        /// </summary>
        private async Task EnsureInitializedAsync()
        {
            if (_isInitialized) return;
            
            try
            {
                // 导入主模块
                _module = await _jsRuntime.InvokeAsync<IJSObjectReference>(
                    "import", 
                    "/js/main.js"
                );
                
                // 注意：AWScriptManager.initialize() 不再由插件服务调用
                // 初始化逻辑现在由C#端通过插件系统按需调用
                _isInitialized = true;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Failed to initialize plugin system", ex);
            }
        }
        
        public async Task InvokeVoidAsync(string pluginName, string methodName, params object?[] args)
        {
            await EnsureInitializedAsync();
            
            try
            {
                // 调用插件方法
                await _module!.InvokeVoidAsync(
                    "AW.invokePlugin",
                    pluginName,
                    methodName,
                    args
                );
            }
            catch (JSException jsEx)
            {
                throw new InvalidOperationException(
                    $"Failed to invoke plugin method {pluginName}.{methodName}: {jsEx.Message}",
                    jsEx
                );
            }
        }
        
        public async Task<TValue> InvokeAsync<TValue>(string pluginName, string methodName, params object?[] args)
        {
            await EnsureInitializedAsync();
            
            try
            {
                // 调用插件方法并返回结果
                return await _module!.InvokeAsync<TValue>(
                    "AW.invokePlugin",
                    pluginName,
                    methodName,
                    args
                );
            }
            catch (JSException jsEx)
            {
                throw new InvalidOperationException(
                    $"Failed to invoke plugin method {pluginName}.{methodName}: {jsEx.Message}",
                    jsEx
                );
            }
        }
        
        public async Task InvokeGlobalVoidAsync(string functionName, params object?[] args)
        {
            await EnsureInitializedAsync();
            
            try
            {
                // 构建函数调用路径
                var functionPath = functionName.Split('.');
                if (functionPath.Length == 1)
                {
                    await _jsRuntime.InvokeVoidAsync(functionName, args);
                }
                else
                {
                    // 对于嵌套路径，使用 window[path1][path2]...
                    await _module!.InvokeVoidAsync(
                        "AW.invokeGlobalFunction",
                        functionName,
                        args
                    );
                }
            }
            catch (JSException jsEx)
            {
                throw new InvalidOperationException(
                    $"Failed to invoke global function {functionName}: {jsEx.Message}",
                    jsEx
                );
            }
        }
        
        public async Task<TValue> InvokeGlobalAsync<TValue>(string functionName, params object?[] args)
        {
            await EnsureInitializedAsync();
            
            try
            {
                // 构建函数调用路径
                var functionPath = functionName.Split('.');
                if (functionPath.Length == 1)
                {
                    return await _jsRuntime.InvokeAsync<TValue>(functionName, args);
                }
                else
                {
                    // 对于嵌套路径，使用 window[path1][path2]...
                    return await _module!.InvokeAsync<TValue>(
                        "AW.invokeGlobalFunction",
                        functionName,
                        args
                    );
                }
            }
            catch (JSException jsEx)
            {
                throw new InvalidOperationException(
                    $"Failed to invoke global function {functionName}: {jsEx.Message}",
                    jsEx
                );
            }
        }
        
        public async Task<bool> PluginExistsAsync(string pluginName)
        {
            await EnsureInitializedAsync();
            
            try
            {
                return await _module!.InvokeAsync<bool>(
                    "AW.pluginExists",
                    pluginName
                );
            }
            catch
            {
                return false;
            }
        }
        
        public async Task<bool> MethodExistsAsync(string pluginName, string methodName)
        {
            await EnsureInitializedAsync();
            
            try
            {
                return await _module!.InvokeAsync<bool>(
                    "AW.methodExists",
                    pluginName,
                    methodName
                );
            }
            catch
            {
                return false;
            }
        }
    }
}