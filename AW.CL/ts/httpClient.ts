export interface RequestOptions extends RequestInit {
    timeout?: number;
    retry?: number;
    retryDelay?: number;
    params?: Record<string, any>;
}

export interface ApiResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Headers;
    ok: boolean;
}

export class HttpClient {
    private baseUrl: string;
    private defaultOptions: RequestOptions;
    
    constructor(baseUrl: string = '', options: RequestOptions = {}) {
        this.baseUrl = baseUrl;
        this.defaultOptions = {
            timeout: 10000,
            retry: 0,
            retryDelay: 1000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            ...options
        };
    }
    
    /**
     * 设置默认请求头
     */
    setHeader(key: string, value: string): void {
        if (!this.defaultOptions.headers) {
            this.defaultOptions.headers = {};
        }
        (this.defaultOptions.headers as Record<string, string>)[key] = value;
    }
    
    /**
     * 移除请求头
     */
    removeHeader(key: string): void {
        if (this.defaultOptions.headers && key in (this.defaultOptions.headers as Record<string, string>)) {
            delete (this.defaultOptions.headers as Record<string, string>)[key];
        }
    }
    
    /**
     * GET请求
     */
    async get<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>(url, { ...options, method: 'GET' });
    }
    
    /**
     * POST请求
     */
    async post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>(url, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        });
    }
    
    /**
     * PUT请求
     */
    async put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>(url, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        });
    }
    
    /**
     * DELETE请求
     */
    async delete<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>(url, { ...options, method: 'DELETE' });
    }
    
    /**
     * PATCH请求
     */
    async patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>(url, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined
        });
    }
    
    /**
     * 上传文件
     */
    async upload<T = any>(url: string, formData: FormData, options?: RequestOptions): Promise<ApiResponse<T>> {
        const headers = new Headers(options?.headers || this.defaultOptions.headers);
        headers.delete('Content-Type'); // FormData会自动设置Content-Type
        
        return this.request<T>(url, {
            ...options,
            method: 'POST',
            headers,
            body: formData
        });
    }
    
    /**
     * 核心请求方法
     */
    private async request<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        const mergedOptions: RequestOptions = {
            ...this.defaultOptions,
            ...options
        };
        
        // 处理查询参数
        let finalUrl = this.buildUrl(url);
        if (mergedOptions.params) {
            const params = new URLSearchParams();
            Object.entries(mergedOptions.params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    params.append(key, String(value));
                }
            });
            const queryString = params.toString();
            if (queryString) {
                finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
            }
        }
        
        let retryCount = 0;
        const maxRetries = mergedOptions.retry ?? 0;
        
        while (true) {
            try {
                const controller = new AbortController();
                const timeoutId = mergedOptions.timeout 
                    ? setTimeout(() => controller.abort(), mergedOptions.timeout)
                    : undefined;
                
                const response = await fetch(finalUrl, {
                    ...mergedOptions,
                    signal: controller.signal
                });
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                
                let data: T;
                const contentType = response.headers.get('content-type');
                
                if (contentType?.includes('application/json')) {
                    data = await response.json();
                } else if (contentType?.includes('text/')) {
                    data = (await response.text()) as any;
                } else {
                    data = (await response.blob()) as any;
                }
                
                return {
                    data,
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    ok: response.ok
                };
                
            } catch (error) {
                if (retryCount >= maxRetries) {
                    throw this.normalizeError(error);
                }
                
                retryCount++;
                const delay = mergedOptions.retryDelay ?? 1000;
                await this.delay(delay * retryCount);
            }
        }
    }
    
    /**
     * 构建完整URL
     */
    private buildUrl(url: string): string {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
        const path = url.startsWith('/') ? url : `/${url}`;
        
        return base + path;
    }
    
    /**
     * 延迟函数
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 规范化错误
     */
    private normalizeError(error: any): Error {
        if (error instanceof Error) {
            return error;
        }
        
        if (error.name === 'AbortError') {
            return new Error('请求超时');
        }
        
        return new Error('网络请求失败');
    }
}

/**
 * 创建全局HTTP客户端实例
 */
export const httpClient = new HttpClient();

/**
 * 便捷函数
 */
export const http = {
    get: <T = any>(url: string, options?: RequestOptions) => httpClient.get<T>(url, options),
    post: <T = any>(url: string, data?: any, options?: RequestOptions) => httpClient.post<T>(url, data, options),
    put: <T = any>(url: string, data?: any, options?: RequestOptions) => httpClient.put<T>(url, data, options),
    delete: <T = any>(url: string, options?: RequestOptions) => httpClient.delete<T>(url, options),
    patch: <T = any>(url: string, data?: any, options?: RequestOptions) => httpClient.patch<T>(url, data, options),
    upload: <T = any>(url: string, formData: FormData, options?: RequestOptions) => httpClient.upload<T>(url, formData, options)
};