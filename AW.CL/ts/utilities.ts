/**
 * 日期时间工具
 */
export class DateUtils {
    /**
     * 格式化日期
     */
    static format(date: Date | string | number, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
        const d = date instanceof Date ? date : new Date(date);
        
        if (isNaN(d.getTime())) {
            return 'Invalid Date';
        }
        
        const pad = (n: number) => n.toString().padStart(2, '0');
        
        const replacements: Record<string, string> = {
            YYYY: d.getFullYear().toString(),
            YY: d.getFullYear().toString().slice(-2),
            MM: pad(d.getMonth() + 1),
            M: (d.getMonth() + 1).toString(),
            DD: pad(d.getDate()),
            D: d.getDate().toString(),
            HH: pad(d.getHours()),
            H: d.getHours().toString(),
            hh: pad(d.getHours() % 12 || 12),
            h: (d.getHours() % 12 || 12).toString(),
            mm: pad(d.getMinutes()),
            m: d.getMinutes().toString(),
            ss: pad(d.getSeconds()),
            s: d.getSeconds().toString(),
            SSS: d.getMilliseconds().toString().padStart(3, '0'),
            A: d.getHours() < 12 ? 'AM' : 'PM',
            a: d.getHours() < 12 ? 'am' : 'pm'
        };
        
        return format.replace(
            /YYYY|YY|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|SSS|A|a/g,
            match => replacements[match]
        );
    }
    
    /**
     * 获取相对时间描述
     */
    static timeAgo(date: Date | string | number): string {
        const d = date instanceof Date ? date : new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffMonth / 12);
        
        if (diffYear > 0) return `${diffYear}年前`;
        if (diffMonth > 0) return `${diffMonth}个月前`;
        if (diffDay > 0) return `${diffDay}天前`;
        if (diffHour > 0) return `${diffHour}小时前`;
        if (diffMin > 0) return `${diffMin}分钟前`;
        if (diffSec > 30) return `${diffSec}秒前`;
        return '刚刚';
    }
    
    /**
     * 检查日期是否在今天
     */
    static isToday(date: Date | string | number): boolean {
        const d = date instanceof Date ? date : new Date(date);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    }
    
    /**
     * 添加天数
     */
    static addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
}

/**
 * 数字工具
 */
export class NumberUtils {
    /**
     * 格式化数字（千分位）
     */
    static format(num: number, decimals: number = 2): string {
        if (isNaN(num)) return '0';
        
        const fixedNum = decimals >= 0 ? num.toFixed(decimals) : num.toString();
        const [integer, decimal] = fixedNum.split('.');
        
        const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        
        return decimal ? `${formattedInteger}.${decimal}` : formattedInteger;
    }
    
    /**
     * 生成随机数
     */
    static random(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * 限制数值范围
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * 将字节转换为可读格式
     */
    static formatBytes(bytes: number, decimals: number = 2): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

/**
 * 字符串工具
 */
export class StringUtils {
    /**
     * 截断字符串并添加省略号
     */
    static truncate(str: string, maxLength: number, suffix: string = '...'): string {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + suffix;
    }
    
    /**
     * 转换为驼峰命名
     */
    static camelCase(str: string): string {
        return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
    }
    
    /**
     * 转换为短横线命名
     */
    static kebabCase(str: string): string {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }
    
    /**
     * 生成随机字符串
     */
    static random(length: number = 8): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    /**
     * 检查字符串是否为空或空白
     */
    static isBlank(str: string): boolean {
        return !str || /^\s*$/.test(str);
    }
}

/**
 * 对象工具
 */
export class ObjectUtils {
    /**
     * 深拷贝对象
     */
    static deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime()) as T;
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item)) as T;
        }
        
        if (typeof obj === 'object') {
            const clonedObj: Record<string, any> = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    clonedObj[key] = this.deepClone((obj as Record<string, any>)[key]);
                }
            }
            return clonedObj as T;
        }
        
        return obj;
    }
    
    /**
     * 合并对象
     */
    static merge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
        const result = this.deepClone(target);
        
        sources.forEach(source => {
            if (!source) return;
            
            Object.keys(source).forEach(key => {
                const targetValue = (result as Record<string, any>)[key];
                const sourceValue = (source as Record<string, any>)[key];
                
                if (this.isPlainObject(targetValue) && this.isPlainObject(sourceValue)) {
                    (result as Record<string, any>)[key] = this.merge(targetValue, sourceValue);
                } else if (sourceValue !== undefined) {
                    (result as Record<string, any>)[key] = sourceValue;
                }
            });
        });
        
        return result;
    }
    
    /**
     * 获取嵌套对象属性值
     */
    static get(obj: Record<string, any>, path: string, defaultValue?: any): any {
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result === null || result === undefined) {
                return defaultValue;
            }
            result = result[key];
        }
        
        return result === undefined ? defaultValue : result;
    }
    
    /**
     * 检查是否是普通对象
     */
    private static isPlainObject(obj: any): boolean {
        return obj !== null && typeof obj === 'object' && !Array.isArray(obj) && !(obj instanceof Date);
    }
}

/**
 * 数组工具
 */
export class ArrayUtils {
    /**
     * 数组去重
     */
    static unique<T>(arr: T[]): T[] {
        return [...new Set(arr)];
    }
    
    /**
     * 数组分组
     */
    static groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
        return arr.reduce((groups, item) => {
            const key = keyFn(item);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {} as Record<string, T[]>);
    }
    
    /**
     * 数组扁平化
     */
    static flatten<T>(arr: (T | T[])[]): T[] {
        const result: T[] = [];
        
        for (const item of arr) {
            if (Array.isArray(item)) {
                result.push(...this.flatten(item));
            } else {
                result.push(item);
            }
        }
        
        return result;
    }
    
    /**
     * 数组分块
     */
    static chunk<T>(arr: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }
}

/**
 * 浏览器工具
 */
export class BrowserUtils {
    /**
     * 检查是否支持localStorage
     */
    static supportsLocalStorage(): boolean {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * 复制文本到剪贴板
     */
    static async copyToClipboard(text: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                return true;
            } catch {
                return false;
            } finally {
                textArea.remove();
            }
        }
    }
    
    /**
     * 下载文件
     */
    static downloadFile(filename: string, content: string | Blob, type?: string): void {
        const blob = content instanceof Blob ? content : new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

/**
 * 全局工具集合
 */
export const utils = {
    date: DateUtils,
    number: NumberUtils,
    string: StringUtils,
    object: ObjectUtils,
    array: ArrayUtils,
    browser: BrowserUtils
};