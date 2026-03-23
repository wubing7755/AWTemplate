using Microsoft.JSInterop;

namespace AW.Client.Services
{
    /// <summary>
    /// 插件服务实现
    /// 提供 C# 端调用 TypeScript 插件系统的桥接能力
    /// 采用装饰器模式封装 JS 互操作逻辑
    /// </summary>
    public class PluginService : IPluginService
    {
        private readonly IJSRuntime _jsRuntime;
        private const string PlugManagerKey = "window.PlugManager";
        
        /// <summary>
        /// 插件服务构造函数
        /// </summary>
        /// <param name="jsRuntime">JavaScript 运行时</param>
        public PluginService(IJSRuntime jsRuntime)
        {
            _jsRuntime = jsRuntime;
        }

        // ==================== 生命周期管理 ====================

        /// <inheritdoc />
        public async Task<PlugInitResult[]> InitializeAsync(string? configPath = null)
        {
            try
            {
                var path = configPath ?? "plugins.json";
                var results = await _jsRuntime.InvokeAsync<PlugInitResult[]>(
                    $"{PlugManagerKey}.loadConfigFromUrl", path);
                return results ?? Array.Empty<PlugInitResult>();
            }
            catch (Exception ex)
            {
                LogError("InitializeAsync", ex);
                return Array.Empty<PlugInitResult>();
            }
        }

        /// <inheritdoc />
        public async Task<PlugInitResult> InitializePlugAsync(string plugName)
        {
            try
            {
                return await _jsRuntime.InvokeAsync<PlugInitResult>(
                    $"{PlugManagerKey}.initializePlug", plugName);
            }
            catch (Exception ex)
            {
                LogError($"InitializePlugAsync({plugName})", ex);
                return new PlugInitResult 
                { 
                    Name = plugName, 
                    Success = false, 
                    Error = ex.Message 
                };
            }
        }

        /// <inheritdoc />
        public async Task DisposePlugAsync(string plugName)
        {
            try
            {
                await _jsRuntime.InvokeVoidAsync(
                    $"{PlugManagerKey}.disposePlug", plugName);
            }
            catch (Exception ex)
            {
                LogError($"DisposePlugAsync({plugName})", ex);
            }
        }

        /// <inheritdoc />
        public async Task DisposeAllAsync()
        {
            try
            {
                await _jsRuntime.InvokeVoidAsync($"{PlugManagerKey}.disposeAll");
            }
            catch (Exception ex)
            {
                LogError("DisposeAllAsync", ex);
            }
        }

        // ==================== 插件信息查询 ====================

        /// <inheritdoc />
        public async Task<bool> HasPlugAsync(string plugName)
        {
            try
            {
                return await _jsRuntime.InvokeAsync<bool>(
                    $"{PlugManagerKey}.hasPlug", plugName);
            }
            catch
            {
                return false;
            }
        }

        /// <inheritdoc />
        public async Task<IReadOnlyList<PlugInfo>> GetPlugInfosAsync()
        {
            try
            {
                // 调用 PlugDebug.logPlugs 的内部逻辑获取插件信息
                var jsCode = $@"
                    (function() {{
                        var plugs = {PlugManagerKey}.getPlugNames();
                        return plugs.map(function(name) {{
                            var plug = {PlugManagerKey}.getPlug(name);
                            return {{
                                Name: name,
                                Description: plug?.description || '',
                                AutoInitialize: plug?.autoInitialize || false,
                                HasInitialize: typeof plug?.initialize === 'function',
                                HasDispose: typeof plug?.dispose === 'function'
                            }};
                        }});
                    }})()
                ";
                
                var result = await _jsRuntime.InvokeAsync<List<PlugInfo>>("eval", jsCode);
                return result ?? new List<PlugInfo>();
            }
            catch (Exception ex)
            {
                LogError("GetPlugInfosAsync", ex);
                return Array.Empty<PlugInfo>();
            }
        }

        /// <inheritdoc />
        public async Task<PlugManagerStatus> GetStatusAsync()
        {
            try
            {
                return await _jsRuntime.InvokeAsync<PlugManagerStatus>(
                    $"{PlugManagerKey}.getStatus");
            }
            catch (Exception ex)
            {
                LogError("GetStatusAsync", ex);
                return new PlugManagerStatus();
            }
        }

        // ==================== 插件方法调用 ====================

        /// <inheritdoc />
        public async Task InvokePlugVoidAsync(string plugName, string methodName = "initialize", params object?[] args)
        {
            try
            {
                var jsCode = $@"
                    (function() {{
                        var plug = {PlugManagerKey}.getPlug('{plugName}');
                        if (plug && typeof plug.{methodName} === 'function') {{
                            return plug.{methodName}({ToJsArgs(args)});
                        }}
                    }})()
                ";
                await _jsRuntime.InvokeVoidAsync("eval", jsCode);
            }
            catch (Exception ex)
            {
                LogError($"InvokePlugVoidAsync({plugName}.{methodName})", ex);
            }
        }

        /// <inheritdoc />
        public async Task<TValue?> InvokePlugAsync<TValue>(string plugName, string methodName, params object?[] args)
        {
            try
            {
                var jsCode = $@"
                    (function() {{
                        var plug = {PlugManagerKey}.getPlug('{plugName}');
                        if (plug && typeof plug.{methodName} === 'function') {{
                            return plug.{methodName}({ToJsArgs(args)});
                        }}
                    }})()
                ";
                return await _jsRuntime.InvokeAsync<TValue>("eval", jsCode);
            }
            catch (Exception ex)
            {
                LogError($"InvokePlugAsync({plugName}.{methodName})", ex);
                return default;
            }
        }

        /// <inheritdoc />
        public async Task InvokeDisposeAsync(string plugName)
        {
            await InvokePlugVoidAsync(plugName, "dispose");
        }

        // ==================== 动态调用 ====================

        /// <inheritdoc />
        public async Task<TValue?> InvokeWindowAsync<TValue>(string objectName, string methodName, params object?[] args)
        {
            try
            {
                return await _jsRuntime.InvokeAsync<TValue>(
                    $"window.{objectName}.{methodName}", args);
            }
            catch (Exception ex)
            {
                LogError($"InvokeWindowAsync({objectName}.{methodName})", ex);
                return default;
            }
        }

        /// <inheritdoc />
        public async Task InvokeWindowVoidAsync(string objectName, string methodName, params object?[] args)
        {
            try
            {
                await _jsRuntime.InvokeVoidAsync(
                    $"window.{objectName}.{methodName}", args);
            }
            catch (Exception ex)
            {
                LogError($"InvokeWindowVoidAsync({objectName}.{methodName})", ex);
            }
        }

        // ==================== 私有辅助方法 ====================

        /// <summary>
        /// 将 C# 参数数组转换为 JavaScript 代码
        /// </summary>
        private static string ToJsArgs(object?[] args)
        {
            if (args == null || args.Length == 0) return "";
            
            var jsArgs = new List<string>();
            foreach (var arg in args)
            {
                if (arg == null)
                {
                    jsArgs.Add("null");
                }
                else if (arg is string str)
                {
                    jsArgs.Add($"'{EscapeJsString(str)}'");
                }
                else if (arg is bool b)
                {
                    jsArgs.Add(b ? "true" : "false");
                }
                else if (arg is int or long or float or double or decimal)
                {
                    jsArgs.Add(arg.ToString() ?? "0");
                }
                else
                {
                    // 其他类型序列化为 JSON
                    jsArgs.Add($"JSON.parse('{EscapeJsString(System.Text.Json.JsonSerializer.Serialize(arg))}')");
                }
            }
            return string.Join(", ", jsArgs);
        }

        /// <summary>
        /// 转义 JavaScript 字符串
        /// </summary>
        private static string EscapeJsString(string str)
        {
            return str
                .Replace("\\", "\\\\")
                .Replace("'", "\\'")
                .Replace("\n", "\\n")
                .Replace("\r", "\\r")
                .Replace("\t", "\\t");
        }

        /// <summary>
        /// 记录错误日志
        /// </summary>
        private void LogError(string method, Exception ex)
        {
            Console.WriteLine($"[PluginService] {method} 失败: {ex.Message}");
        }
    }
}
