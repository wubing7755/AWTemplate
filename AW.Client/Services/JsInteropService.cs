using Microsoft.JSInterop;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace AW.Client.Services
{
    /// <summary>
    /// JavaScript 互操作服务的实现
    /// </summary>
    public class JsInteropService : IJsInteropService, IAsyncDisposable
    {
        private readonly IJSRuntime _jsRuntime;
        private readonly ILogger<JsInteropService> _logger;
        private readonly Dictionary<string, IJSObjectReference> _loadedModules = new();

        /// <summary>
        /// 初始化 JsInteropService 的新实例
        /// </summary>
        /// <param name="jsRuntime">JavaScript 运行时</param>
        /// <param name="logger">日志记录器</param>
        public JsInteropService(IJSRuntime jsRuntime, ILogger<JsInteropService> logger)
        {
            _jsRuntime = jsRuntime ?? throw new ArgumentNullException(nameof(jsRuntime));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// 调用 JavaScript 函数并返回结果
        /// </summary>
        /// <typeparam name="TValue">返回值的类型</typeparam>
        /// <param name="identifier">JavaScript 函数标识符（全局函数名或 module.function）</param>
        /// <param name="args">传递给 JavaScript 函数的参数</param>
        /// <returns>JavaScript 函数的返回值</returns>
        public async ValueTask<TValue> InvokeAsync<TValue>(string identifier, params object?[]? args)
        {
            if (string.IsNullOrWhiteSpace(identifier))
                throw new ArgumentException("标识符不能为空", nameof(identifier));

            try
            {
                _logger.LogDebug("调用 JavaScript 函数: {Identifier} 参数: {ArgsCount}", identifier, args?.Length ?? 0);

                var sw = Stopwatch.StartNew();
                var result = await _jsRuntime.InvokeAsync<TValue>(identifier, args);
                sw.Stop();

                _logger.LogDebug("JavaScript 函数调用完成: {Identifier} 耗时: {Elapsed}ms", identifier, sw.ElapsedMilliseconds);

                return result;
            }
            catch (JSException ex)
            {
                _logger.LogError(ex, "JavaScript 函数调用失败: {Identifier}", identifier);
                throw new JsInteropException($"JavaScript 函数调用失败: {identifier}", ex);
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "JavaScript 函数调用超时: {Identifier}", identifier);
                throw new JsInteropException($"JavaScript 函数调用超时: {identifier}", ex);
            }
        }

        /// <summary>
        /// 调用不返回值的 JavaScript 函数
        /// </summary>
        /// <param name="identifier">JavaScript 函数标识符（全局函数名或 module.function）</param>
        /// <param name="args">传递给 JavaScript 函数的参数</param>
        public async ValueTask InvokeVoidAsync(string identifier, params object?[]? args)
        {
            if (string.IsNullOrWhiteSpace(identifier))
                throw new ArgumentException("标识符不能为空", nameof(identifier));

            try
            {
                _logger.LogDebug("调用无返回值的 JavaScript 函数: {Identifier} 参数: {ArgsCount}", identifier, args?.Length ?? 0);

                var sw = Stopwatch.StartNew();
                await _jsRuntime.InvokeVoidAsync(identifier, args);
                sw.Stop();

                _logger.LogDebug("JavaScript 函数调用完成: {Identifier} 耗时: {Elapsed}ms", identifier, sw.ElapsedMilliseconds);
            }
            catch (JSException ex)
            {
                _logger.LogError(ex, "JavaScript 函数调用失败: {Identifier}", identifier);
                throw new JsInteropException($"JavaScript 函数调用失败: {identifier}", ex);
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "JavaScript 函数调用超时: {Identifier}", identifier);
                throw new JsInteropException($"JavaScript 函数调用超时: {identifier}", ex);
            }
        }

        /// <summary>
        /// 导入 JavaScript 模块
        /// </summary>
        /// <param name="modulePath">模块路径</param>
        /// <returns>JavaScript 模块引用</returns>
        public async ValueTask<IJSObjectReference> ImportModuleAsync(string modulePath)
        {
            if (string.IsNullOrWhiteSpace(modulePath))
                throw new ArgumentException("模块路径不能为空", nameof(modulePath));

            try
            {
                // 检查是否已加载该模块
                if (_loadedModules.TryGetValue(modulePath, out var cachedModule))
                {
                    _logger.LogDebug("使用缓存的 JavaScript 模块: {ModulePath}", modulePath);
                    return cachedModule;
                }

                _logger.LogDebug("导入 JavaScript 模块: {ModulePath}", modulePath);

                var sw = Stopwatch.StartNew();
                var module = await _jsRuntime.InvokeAsync<IJSObjectReference>("import", modulePath);
                sw.Stop();

                _loadedModules[modulePath] = module;
                _logger.LogDebug("JavaScript 模块导入完成: {ModulePath} 耗时: {Elapsed}ms", modulePath, sw.ElapsedMilliseconds);

                return module;
            }
            catch (JSException ex)
            {
                _logger.LogError(ex, "JavaScript 模块导入失败: {ModulePath}", modulePath);
                throw new JsInteropException($"JavaScript 模块导入失败: {modulePath}", ex);
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "JavaScript 模块导入超时: {ModulePath}", modulePath);
                throw new JsInteropException($"JavaScript 模块导入超时: {modulePath}", ex);
            }
        }

        /// <summary>
        /// 调用 JavaScript 模块中的函数并返回结果
        /// </summary>
        /// <typeparam name="TValue">返回值的类型</typeparam>
        /// <param name="module">JavaScript 模块引用</param>
        /// <param name="functionName">模块中的函数名</param>
        /// <param name="args">传递给函数的参数</param>
        /// <returns>JavaScript 函数的返回值</returns>
        public async ValueTask<TValue> InvokeModuleAsync<TValue>(IJSObjectReference module, string functionName, params object?[]? args)
        {
            if (module == null)
                throw new ArgumentNullException(nameof(module));
            if (string.IsNullOrWhiteSpace(functionName))
                throw new ArgumentException("函数名不能为空", nameof(functionName));

            try
            {
                _logger.LogDebug("调用 JavaScript 模块函数: {FunctionName} 参数: {ArgsCount}", functionName, args?.Length ?? 0);

                var sw = Stopwatch.StartNew();
                var result = await module.InvokeAsync<TValue>(functionName, args);
                sw.Stop();

                _logger.LogDebug("JavaScript 模块函数调用完成: {FunctionName} 耗时: {Elapsed}ms", functionName, sw.ElapsedMilliseconds);

                return result;
            }
            catch (JSException ex)
            {
                _logger.LogError(ex, "JavaScript 模块函数调用失败: {FunctionName}", functionName);
                throw new JsInteropException($"JavaScript 模块函数调用失败: {functionName}", ex);
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "JavaScript 模块函数调用超时: {FunctionName}", functionName);
                throw new JsInteropException($"JavaScript 模块函数调用超时: {functionName}", ex);
            }
        }

        /// <summary>
        /// 调用 JavaScript 模块中的不返回值函数
        /// </summary>
        /// <param name="module">JavaScript 模块引用</param>
        /// <param name="functionName">模块中的函数名</param>
        /// <param name="args">传递给函数的参数</param>
        public async ValueTask InvokeModuleVoidAsync(IJSObjectReference module, string functionName, params object?[]? args)
        {
            if (module == null)
                throw new ArgumentNullException(nameof(module));
            if (string.IsNullOrWhiteSpace(functionName))
                throw new ArgumentException("函数名不能为空", nameof(functionName));

            try
            {
                _logger.LogDebug("调用无返回值的 JavaScript 模块函数: {FunctionName} 参数: {ArgsCount}", functionName, args?.Length ?? 0);

                var sw = Stopwatch.StartNew();
                await module.InvokeVoidAsync(functionName, args);
                sw.Stop();

                _logger.LogDebug("JavaScript 模块函数调用完成: {FunctionName} 耗时: {Elapsed}ms", functionName, sw.ElapsedMilliseconds);
            }
            catch (JSException ex)
            {
                _logger.LogError(ex, "JavaScript 模块函数调用失败: {FunctionName}", functionName);
                throw new JsInteropException($"JavaScript 模块函数调用失败: {functionName}", ex);
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "JavaScript 模块函数调用超时: {FunctionName}", functionName);
                throw new JsInteropException($"JavaScript 模块函数调用超时: {functionName}", ex);
            }
        }

        /// <summary>
        /// 导入模块并调用其中的函数
        /// </summary>
        /// <typeparam name="TValue">返回值的类型</typeparam>
        /// <param name="modulePath">模块路径</param>
        /// <param name="functionName">模块中的函数名</param>
        /// <param name="args">传递给函数的参数</param>
        /// <returns>JavaScript 函数的返回值</returns>
        public async ValueTask<TValue> ImportAndInvokeAsync<TValue>(string modulePath, string functionName, params object?[]? args)
        {
            var module = await ImportModuleAsync(modulePath);
            return await InvokeModuleAsync<TValue>(module, functionName, args);
        }

        /// <summary>
        /// 导入模块并调用其中的无返回值函数
        /// </summary>
        /// <param name="modulePath">模块路径</param>
        /// <param name="functionName">模块中的函数名</param>
        /// <param name="args">传递给函数的参数</param>
        public async ValueTask ImportAndInvokeVoidAsync(string modulePath, string functionName, params object?[]? args)
        {
            var module = await ImportModuleAsync(modulePath);
            await InvokeModuleVoidAsync(module, functionName, args);
        }

        /// <summary>
        /// 检查 JavaScript 函数是否存在
        /// </summary>
        /// <param name="functionName">函数名</param>
        /// <returns>如果函数存在返回 true，否则返回 false</returns>
        public async ValueTask<bool> FunctionExistsAsync(string functionName)
        {
            try
            {
                var exists = await _jsRuntime.InvokeAsync<bool>("eval", $"typeof {functionName} !== 'undefined'");
                return exists;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// 添加 CSS 类到元素
        /// </summary>
        /// <param name="elementId">元素 ID</param>
        /// <param name="className">CSS 类名</param>
        public async ValueTask AddClassAsync(string elementId, string className)
        {
            await InvokeVoidAsync("addClass", elementId, className);
        }

        /// <summary>
        /// 从元素移除 CSS 类
        /// </summary>
        /// <param name="elementId">元素 ID</param>
        /// <param name="className">CSS 类名</param>
        public async ValueTask RemoveClassAsync(string elementId, string className)
        {
            await InvokeVoidAsync("removeClass", elementId, className);
        }

        /// <summary>
        /// 切换元素的 CSS 类
        /// </summary>
        /// <param name="elementId">元素 ID</param>
        /// <param name="className">CSS 类名</param>
        public async ValueTask ToggleClassAsync(string elementId, string className)
        {
            await InvokeVoidAsync("toggleClass", elementId, className);
        }

        /// <summary>
        /// 显示元素
        /// </summary>
        /// <param name="elementId">元素 ID</param>
        public async ValueTask ShowElementAsync(string elementId)
        {
            await InvokeVoidAsync("showElement", elementId);
        }

        /// <summary>
        /// 隐藏元素
        /// </summary>
        /// <param name="elementId">元素 ID</param>
        public async ValueTask HideElementAsync(string elementId)
        {
            await InvokeVoidAsync("hideElement", elementId);
        }

        /// <summary>
        /// 显示 Toast 通知
        /// </summary>
        /// <param name="message">消息内容</param>
        /// <param name="type">消息类型（success, error, warning, info）</param>
        /// <param name="duration">显示时长（毫秒）</param>
        public async ValueTask ShowToastAsync(string message, string type = "info", int duration = 3000)
        {
            await InvokeVoidAsync("showToast", message, type, duration);
        }

        /// <summary>
        /// 显示确认对话框
        /// </summary>
        /// <param name="message">确认消息</param>
        /// <param name="title">对话框标题</param>
        /// <returns>如果用户点击确认返回 true，否则返回 false</returns>
        public async ValueTask<bool> ShowConfirmAsync(string message, string title = "确认")
        {
            return await InvokeAsync<bool>("showConfirm", message, title);
        }

        /// <summary>
        /// 显示提示对话框
        /// </summary>
        /// <param name="message">提示消息</param>
        /// <param name="title">对话框标题</param>
        /// <returns>用户输入的内容</returns>
        public async ValueTask<string> ShowPromptAsync(string message, string title = "提示")
        {
            return await InvokeAsync<string>("showPrompt", message, title);
        }



        /// <summary>
        /// 清理脚本功能
        /// </summary>
        /// <param name="fullCleanup">是否完全清理（包括 localStorage 中的主题设置）</param>
        public async ValueTask CleanupScriptsAsync(bool fullCleanup = false)
        {
            await InvokeVoidAsync("cleanupScripts", fullCleanup);
        }

        /// <summary>
        /// 异步释放资源
        /// </summary>
        public async ValueTask DisposeAsync()
        {
            foreach (var module in _loadedModules.Values)
            {
                try
                {
                    await module.DisposeAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "释放 JavaScript 模块时发生错误");
                }
            }

            _loadedModules.Clear();
        }
    }

    /// <summary>
    /// JavaScript 互操作异常
    /// </summary>
    public class JsInteropException : Exception
    {
        /// <summary>
        /// 初始化 JsInteropException 的新实例
        /// </summary>
        /// <param name="message">异常消息</param>
        public JsInteropException(string message) : base(message)
        {
        }

        /// <summary>
        /// 初始化 JsInteropException 的新实例
        /// </summary>
        /// <param name="message">异常消息</param>
        /// <param name="innerException">内部异常</param>
        public JsInteropException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}
