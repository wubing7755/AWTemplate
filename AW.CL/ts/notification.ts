/**
 * 通知系统插件
 * 提供全局通知功能，支持成功、错误、警告、信息四种类型
 */

export interface NotificationOptions {
    /** 通知类型 */
    type?: 'success' | 'error' | 'warning' | 'info';
    /** 持续时间（毫秒），0表示不自动关闭 */
    duration?: number;
    /** 自定义CSS类 */
    className?: string;
    /** 是否显示关闭按钮 */
    closable?: boolean;
    /** 点击通知时的回调 */
    onClick?: () => void;
}

export class NotificationManager {
    private container: HTMLElement | null = null;
    private notifications: Map<string, HTMLElement> = new Map();
    private defaultOptions: NotificationOptions = {
        type: 'info',
        duration: 5000,
        closable: true
    };

    /**
     * 初始化通知容器
     */
    private ensureContainer(): HTMLElement {
        if (this.container) return this.container;

        const container = document.createElement('div');
        container.id = 'aw-notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;

        document.body.appendChild(container);
        this.container = container;
        return container;
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取类型对应的颜色
     */
    private getTypeColor(type: string): string {
        const colors: Record<string, string> = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        return colors[type] || colors.info;
    }

    /**
     * 显示通知
     * @param message 通知内容
     * @param options 配置选项
     * @returns 通知ID（用于手动关闭）
     */
    show(message: string, options: NotificationOptions = {}): string {
        const mergedOptions = { ...this.defaultOptions, ...options };
        const id = this.generateId();
        const container = this.ensureContainer();

        // 创建通知元素
        const notification = document.createElement('div');
        notification.id = id;
        notification.style.cssText = `
            background: white;
            border-left: 4px solid ${this.getTypeColor(mergedOptions.type!)};
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            padding: 16px;
            font-size: 14px;
            line-height: 1.5;
            color: #333;
            transition: opacity 0.3s, transform 0.3s;
            transform: translateX(100%);
            opacity: 0;
            max-width: 100%;
            word-break: break-word;
        `;

        if (mergedOptions.className) {
            notification.className = mergedOptions.className;
        }

        // 添加内容
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        notification.appendChild(messageEl);

        // 添加关闭按钮
        if (mergedOptions.closable) {
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                font-size: 18px;
                line-height: 1;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            closeBtn.addEventListener('click', () => this.close(id));
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.color = '#666';
                closeBtn.style.background = '#f5f5f5';
            });
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.color = '#999';
                closeBtn.style.background = 'none';
            });
            notification.appendChild(closeBtn);
        }

        // 点击事件
        if (mergedOptions.onClick) {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', mergedOptions.onClick);
        }

        container.appendChild(notification);

        // 触发动画
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // 自动关闭
        if (mergedOptions.duration && mergedOptions.duration > 0) {
            setTimeout(() => this.close(id), mergedOptions.duration);
        }

        this.notifications.set(id, notification);
        return id;
    }

    /**
     * 关闭指定通知
     * @param id 通知ID
     */
    close(id: string): void {
        const notification = this.notifications.get(id);
        if (!notification) return;

        // 动画关闭
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * 关闭所有通知
     */
    closeAll(): void {
        Array.from(this.notifications.keys()).forEach(id => this.close(id));
    }

    /**
     * 更新默认配置
     * @param options 新的默认配置
     */
    setDefaults(options: NotificationOptions): void {
        this.defaultOptions = { ...this.defaultOptions, ...options };
    }

    /**
     * 获取当前通知数量
     */
    getCount(): number {
        return this.notifications.size;
    }

    /**
     * 清理容器（完全移除）
     */
    destroy(): void {
        this.closeAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.container = null;
        }
    }
}

// 创建全局实例
export const notification = new NotificationManager();

// 便捷函数
export const notify = {
    success: (message: string, options?: NotificationOptions) => 
        notification.show(message, { ...options, type: 'success' }),
    error: (message: string, options?: NotificationOptions) => 
        notification.show(message, { ...options, type: 'error' }),
    warning: (message: string, options?: NotificationOptions) => 
        notification.show(message, { ...options, type: 'warning' }),
    info: (message: string, options?: NotificationOptions) => 
        notification.show(message, { ...options, type: 'info' }),
    close: (id: string) => notification.close(id),
    closeAll: () => notification.closeAll()
};