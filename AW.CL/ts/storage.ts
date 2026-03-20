export interface StorageOptions {
    expires?: number | Date; // 过期时间（毫秒或Date对象）
    prefix?: string; // 键前缀
}

export class StorageManager {
    protected prefix: string;
    
    constructor(prefix: string = 'app_') {
        this.prefix = prefix;
    }
    
    /**
     * 设置存储项
     */
    set<T = any>(key: string, value: T, options?: StorageOptions): void {
        const fullKey = this.getFullKey(key);
        const item = {
            data: value,
            meta: {
                createdAt: Date.now(),
                expires: options?.expires instanceof Date 
                    ? options.expires.getTime() 
                    : options?.expires ? Date.now() + options.expires : undefined
            }
        };
        
        try {
            localStorage.setItem(fullKey, JSON.stringify(item));
        } catch (error) {
            console.warn('localStorage写入失败:', error);
            this.handleStorageError(error);
        }
    }
    
    /**
     * 获取存储项
     */
    get<T = any>(key: string): T | null {
        const fullKey = this.getFullKey(key);
        
        try {
            const itemStr = localStorage.getItem(fullKey);
            if (!itemStr) {
                return null;
            }
            
            const item = JSON.parse(itemStr);
            
            // 检查是否过期
            if (item.meta?.expires && Date.now() > item.meta.expires) {
                this.remove(key);
                return null;
            }
            
            return item.data;
        } catch (error) {
            console.warn('localStorage读取失败:', error);
            return null;
        }
    }
    
    /**
     * 获取存储项，如果不存在则设置默认值
     */
    getOrSet<T = any>(key: string, defaultValue: T, options?: StorageOptions): T {
        const existing = this.get<T>(key);
        if (existing !== null) {
            return existing;
        }
        
        this.set(key, defaultValue, options);
        return defaultValue;
    }
    
    /**
     * 移除存储项
     */
    remove(key: string): void {
        const fullKey = this.getFullKey(key);
        try {
            localStorage.removeItem(fullKey);
        } catch (error) {
            console.warn('localStorage删除失败:', error);
        }
    }
    
    /**
     * 检查存储项是否存在
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }
    
    /**
     * 清空所有带前缀的存储项
     */
    clear(): void {
        try {
            const keysToRemove: string[] = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.warn('localStorage清空失败:', error);
        }
    }
    
    /**
     * 获取所有存储项的键
     */
    keys(): string[] {
        const keys: string[] = [];
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    // 移除前缀返回原始键
                    keys.push(key.substring(this.prefix.length));
                }
            }
        } catch (error) {
            console.warn('获取存储键失败:', error);
        }
        
        return keys;
    }
    
    /**
     * 获取所有存储项
     */
    getAll<T = any>(): Record<string, T> {
        const result: Record<string, T> = {};
        
        this.keys().forEach(key => {
            const value = this.get<T>(key);
            if (value !== null) {
                result[key] = value;
            }
        });
        
        return result;
    }
    
    /**
     * 设置过期时间
     */
    setExpires(key: string, expires: number | Date): void {
        const value = this.get(key);
        if (value !== null) {
            this.set(key, value, { expires });
        }
    }
    
    /**
     * 获取剩余过期时间（毫秒）
     */
    getTimeToLive(key: string): number | null {
        const fullKey = this.getFullKey(key);
        
        try {
            const itemStr = localStorage.getItem(fullKey);
            if (!itemStr) {
                return null;
            }
            
            const item = JSON.parse(itemStr);
            if (!item.meta?.expires) {
                return Infinity; // 永不过期
            }
            
            const ttl = item.meta.expires - Date.now();
            return ttl > 0 ? ttl : 0;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * 清除所有过期的存储项
     */
    clearExpired(): void {
        const keys = this.keys();
        
        keys.forEach(key => {
            // 调用get会自动清理过期的项
            this.get(key);
        });
    }
    
    /**
     * 获取带前缀的完整键
     */
    protected getFullKey(key: string): string {
        return `${this.prefix}${key}`;
    }
    
    /**
     * 处理存储错误
     */
    private handleStorageError(error: any): void {
        // 如果是存储空间不足，尝试清理过期数据
        if (error && error.name === 'QuotaExceededError') {
            this.clearExpired();
        }
    }
}

/**
 * 会话存储管理器
 */
export class SessionStorageManager extends StorageManager {
    constructor(prefix: string = 'app_session_') {
        super(prefix);
    }
    
    set<T = any>(key: string, value: T, options?: StorageOptions): void {
        const fullKey = this.getFullKey(key);
        const item = {
            data: value,
            meta: {
                createdAt: Date.now(),
                expires: options?.expires instanceof Date 
                    ? options.expires.getTime() 
                    : options?.expires ? Date.now() + options.expires : undefined
            }
        };
        
        try {
            sessionStorage.setItem(fullKey, JSON.stringify(item));
        } catch (error) {
            console.warn('sessionStorage写入失败:', error);
        }
    }
    
    get<T = any>(key: string): T | null {
        const fullKey = this.getFullKey(key);
        
        try {
            const itemStr = sessionStorage.getItem(fullKey);
            if (!itemStr) {
                return null;
            }
            
            const item = JSON.parse(itemStr);
            
            if (item.meta?.expires && Date.now() > item.meta.expires) {
                this.remove(key);
                return null;
            }
            
            return item.data;
        } catch (error) {
            console.warn('sessionStorage读取失败:', error);
            return null;
        }
    }
    
    remove(key: string): void {
        const fullKey = this.getFullKey(key);
        try {
            sessionStorage.removeItem(fullKey);
        } catch (error) {
            console.warn('sessionStorage删除失败:', error);
        }
    }
    
    clear(): void {
        try {
            const keysToRemove: string[] = [];
            
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => sessionStorage.removeItem(key));
        } catch (error) {
            console.warn('sessionStorage清空失败:', error);
        }
    }
}

/**
 * 全局存储实例
 */
export const storage = new StorageManager();
export const session = new SessionStorageManager();

/**
 * 便捷函数
 */
export const store = {
    set: <T = any>(key: string, value: T, options?: StorageOptions) => storage.set(key, value, options),
    get: <T = any>(key: string) => storage.get<T>(key),
    remove: (key: string) => storage.remove(key),
    clear: () => storage.clear(),
    has: (key: string) => storage.has(key)
};