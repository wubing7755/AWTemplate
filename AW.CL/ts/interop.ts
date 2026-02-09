// TypeScript 互操作函数库
// 为 Blazor WebAssembly 提供统一的 JavaScript 调用接口

// 类型定义
type ToastType = "success" | "error" | "warning" | "info";

interface ToastColors {
  success: string;
  error: string;
  warning: string;
  info: string;
}

interface ScrollPosition {
  x: number;
  y: number;
}

interface WindowSize {
  width: number;
  height: number;
}

// 扩展 Window 接口的声明（在全局范围内可用）
interface Window {
  addClass: (elementId: string, className: string) => boolean;
  removeClass: (elementId: string, className: string) => boolean;
  toggleClass: (elementId: string, className: string) => boolean;
  showElement: (elementId: string) => boolean;
  hideElement: (elementId: string) => boolean;
  showToast: (message: string, type?: ToastType, duration?: number) => boolean;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  showPrompt: (
    message: string,
    title?: string,
    defaultValue?: string,
  ) => Promise<string | null>;
  getScrollPosition: () => ScrollPosition;
  scrollToPosition: (x: number, y: number) => boolean;
  scrollToElement: (elementId: string) => boolean;
  getWindowSize: () => WindowSize;
  copyToClipboard: (text: string) => Promise<boolean>;
  DragManager: {
    init(container?: HTMLElement | Document): void;
    destroy(): void;
  };
  initThemeToggle(): void;
}

// Toast 通知系统
(window as any).showToast = function (
  message: string,
  type: ToastType = "info",
  duration: number = 3000,
): boolean {
  try {
    // 创建或获取 Toast 容器
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
      document.body.appendChild(container);
    }

    // 创建 Toast 元素
    const toast = document.createElement("div");
    toast.style.cssText = `
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            opacity: 0;
            transform: translateX(100px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 100%;
        `;

    // 根据类型设置样式
    const typeColors: ToastColors = {
      success: "#4caf50",
      error: "#f44336",
      warning: "#ff9800",
      info: "#2196f3",
    };

    toast.style.backgroundColor = typeColors[type] || typeColors.info;

    // 添加消息内容
    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);

    // 添加关闭按钮
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            margin-left: 15px;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
        `;
    closeButton.addEventListener("click", () => removeToast(toast));
    toast.appendChild(closeButton);

    // 添加到容器
    container.appendChild(toast);

    // 显示动画
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(0)";
    }, 10);

    // 自动移除
    setTimeout(() => {
      removeToast(toast);
    }, duration);

    function removeToast(toastElement: HTMLDivElement): void {
      toastElement.style.opacity = "0";
      toastElement.style.transform = "translateX(100px)";
      setTimeout(() => {
        if (toastElement.parentNode === container) {
          container!.removeChild(toastElement);
        }
        // 如果容器为空，移除容器
        if (container!.children.length === 0) {
          container!.parentNode?.removeChild(container!);
        }
      }, 300);
    }

    return true;
  } catch (error) {
    console.error("显示 Toast 时发生错误:", error);
    // 回退到简单的 alert
    alert(`${type.toUpperCase()}: ${message}`);
    return false;
  }
};

// 确认对话框
(window as any).showConfirm = function (
  message: string,
  title: string = "确认",
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      // 创建遮罩层
      const overlay = document.createElement("div");
      overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 999998;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;

      // 创建对话框
      const dialog = document.createElement("div");
      dialog.style.cssText = `
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                padding: 24px;
                min-width: 300px;
                max-width: 500px;
                transform: translateY(-20px);
                transition: transform 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;

      // 标题
      const titleElement = document.createElement("h3");
      titleElement.textContent = title;
      titleElement.style.cssText = `
                margin: 0 0 16px 0;
                color: #333;
                font-size: 18px;
                font-weight: 600;
            `;
      dialog.appendChild(titleElement);

      // 消息
      const messageElement = document.createElement("p");
      messageElement.textContent = message;
      messageElement.style.cssText = `
                margin: 0 0 24px 0;
                color: #666;
                font-size: 14px;
                line-height: 1.5;
            `;
      dialog.appendChild(messageElement);

      // 按钮容器
      const buttonContainer = document.createElement("div");
      buttonContainer.style.cssText = `
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            `;

      // 取消按钮
      const cancelButton = document.createElement("button");
      cancelButton.textContent = "取消";
      cancelButton.style.cssText = `
                padding: 8px 20px;
                border: 1px solid #ddd;
                background-color: white;
                color: #666;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            `;
      cancelButton.addEventListener("mouseenter", () => {
        cancelButton.style.backgroundColor = "#f5f5f5";
      });
      cancelButton.addEventListener("mouseleave", () => {
        cancelButton.style.backgroundColor = "white";
      });
      cancelButton.addEventListener("click", () => {
        closeDialog(false);
      });

      // 确认按钮
      const confirmButton = document.createElement("button");
      confirmButton.textContent = "确认";
      confirmButton.style.cssText = `
                padding: 8px 20px;
                border: none;
                background-color: #2196f3;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s ease;
            `;
      confirmButton.addEventListener("mouseenter", () => {
        confirmButton.style.backgroundColor = "#1976d2";
      });
      confirmButton.addEventListener("mouseleave", () => {
        confirmButton.style.backgroundColor = "#2196f3";
      });
      confirmButton.addEventListener("click", () => {
        closeDialog(true);
      });

      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(confirmButton);
      dialog.appendChild(buttonContainer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // 显示动画
      setTimeout(() => {
        overlay.style.opacity = "1";
        dialog.style.transform = "translateY(0)";
      }, 10);

      // 点击遮罩层关闭
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          closeDialog(false);
        }
      });

      // 键盘事件
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          closeDialog(false);
        } else if (e.key === "Enter") {
          closeDialog(true);
        }
      };
      document.addEventListener("keydown", handleKeyDown);

      function closeDialog(result: boolean): void {
        document.removeEventListener("keydown", handleKeyDown);
        overlay.style.opacity = "0";
        dialog.style.transform = "translateY(-20px)";
        setTimeout(() => {
          if (overlay.parentNode === document.body) {
            document.body.removeChild(overlay);
          }
          resolve(result);
        }, 300);
      }
    } catch (error) {
      console.error("显示确认对话框时发生错误:", error);
      // 回退到浏览器原生 confirm
      const result = confirm(`${title}: ${message}`);
      resolve(result);
    }
  });
};

// 提示对话框
(window as any).showPrompt = function (
  message: string,
  title: string = "提示",
  defaultValue: string = "",
): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    try {
      // 创建遮罩层
      const overlay = document.createElement("div");
      overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 999998;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;

      // 创建对话框
      const dialog = document.createElement("div");
      dialog.style.cssText = `
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                padding: 24px;
                min-width: 300px;
                max-width: 500px;
                transform: translateY(-20px);
                transition: transform 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;

      // 标题
      const titleElement = document.createElement("h3");
      titleElement.textContent = title;
      titleElement.style.cssText = `
                margin: 0 0 16px 0;
                color: #333;
                font-size: 18px;
                font-weight: 600;
            `;
      dialog.appendChild(titleElement);

      // 消息
      const messageElement = document.createElement("p");
      messageElement.textContent = message;
      messageElement.style.cssText = `
                margin: 0 0 16px 0;
                color: #666;
                font-size: 14px;
                line-height: 1.5;
            `;
      dialog.appendChild(messageElement);

      // 输入框
      const input = document.createElement("input");
      input.type = "text";
      input.value = defaultValue;
      input.style.cssText = `
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
                margin-bottom: 24px;
                outline: none;
                transition: border-color 0.2s ease;
            `;
      input.addEventListener("focus", () => {
        input.style.borderColor = "#2196f3";
      });
      input.addEventListener("blur", () => {
        input.style.borderColor = "#ddd";
      });
      dialog.appendChild(input);

      // 按钮容器
      const buttonContainer = document.createElement("div");
      buttonContainer.style.cssText = `
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            `;

      // 取消按钮
      const cancelButton = document.createElement("button");
      cancelButton.textContent = "取消";
      cancelButton.style.cssText = `
                padding: 8px 20px;
                border: 1px solid #ddd;
                background-color: white;
                color: #666;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            `;
      cancelButton.addEventListener("mouseenter", () => {
        cancelButton.style.backgroundColor = "#f5f5f5";
      });
      cancelButton.addEventListener("mouseleave", () => {
        cancelButton.style.backgroundColor = "white";
      });
      cancelButton.addEventListener("click", () => {
        closeDialog(null);
      });

      // 确认按钮
      const confirmButton = document.createElement("button");
      confirmButton.textContent = "确认";
      confirmButton.style.cssText = `
                padding: 8px 20px;
                border: none;
                background-color: #2196f3;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s ease;
            `;
      confirmButton.addEventListener("mouseenter", () => {
        confirmButton.style.backgroundColor = "#1976d2";
      });
      confirmButton.addEventListener("mouseleave", () => {
        confirmButton.style.backgroundColor = "#2196f3";
      });
      confirmButton.addEventListener("click", () => {
        closeDialog(input.value);
      });

      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(confirmButton);
      dialog.appendChild(buttonContainer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // 显示动画并聚焦输入框
      setTimeout(() => {
        overlay.style.opacity = "1";
        dialog.style.transform = "translateY(0)";
        input.focus();
        input.select();
      }, 10);

      // 点击遮罩层关闭
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          closeDialog(null);
        }
      });

      // 键盘事件
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          closeDialog(null);
        } else if (e.key === "Enter") {
          closeDialog(input.value);
        }
      };
      document.addEventListener("keydown", handleKeyDown);

      // 输入框键盘事件
      input.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          closeDialog(input.value);
        }
      });

      function closeDialog(result: string | null): void {
        document.removeEventListener("keydown", handleKeyDown);
        overlay.style.opacity = "0";
        dialog.style.transform = "translateY(-20px)";
        setTimeout(() => {
          if (overlay.parentNode === document.body) {
            document.body.removeChild(overlay);
          }
          resolve(result);
        }, 300);
      }
    } catch (error) {
      console.error("显示提示对话框时发生错误:", error);
      // 回退到浏览器原生 prompt
      const result = prompt(`${title}: ${message}`, defaultValue);
      resolve(result);
    }
  });
};

// DOM 操作函数
(window as any).addClass = function (
  elementId: string,
  className: string,
): boolean {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add(className);
    return true;
  }
  console.warn(`元素 ${elementId} 未找到，无法添加类 ${className}`);
  return false;
};

(window as any).removeClass = function (
  elementId: string,
  className: string,
): boolean {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.remove(className);
    return true;
  }
  console.warn(`元素 ${elementId} 未找到，无法移除类 ${className}`);
  return false;
};

(window as any).toggleClass = function (
  elementId: string,
  className: string,
): boolean {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.toggle(className);
    return true;
  }
  console.warn(`元素 ${elementId} 未找到，无法切换类 ${className}`);
  return false;
};

(window as any).showElement = function (elementId: string): boolean {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = "";
    element.style.visibility = "visible";
    return true;
  }
  console.warn(`元素 ${elementId} 未找到，无法显示`);
  return false;
};

(window as any).hideElement = function (elementId: string): boolean {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = "none";
    element.style.visibility = "hidden";
    return true;
  }
  console.warn(`元素 ${elementId} 未找到，无法隐藏`);
  return false;
};

// 实用工具函数
(window as any).getScrollPosition = function (): ScrollPosition {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  };
};

(window as any).scrollToPosition = function (x: number, y: number): boolean {
  window.scrollTo(x, y);
  return true;
};

(window as any).scrollToElement = function (elementId: string): boolean {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
    return true;
  }
  return false;
};

(window as any).getWindowSize = function (): WindowSize {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
};

(window as any).copyToClipboard = function (text: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      // 现代浏览器使用 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => resolve(true))
          .catch(() => {
            // 回退到老式方法
            fallbackCopyToClipboard(text, resolve);
          });
      } else {
        fallbackCopyToClipboard(text, resolve);
      }
    } catch (error) {
      console.error("复制到剪贴板失败:", error);
      resolve(false);
    }
  });

  function fallbackCopyToClipboard(
    text: string,
    resolve: (value: boolean) => void,
  ): void {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      resolve(successful);
    } catch (err) {
      console.error("老式复制方法失败:", err);
      resolve(false);
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

// 初始化所有脚本功能 - 由 moduleLoader 提供
// 此函数由 moduleLoader.js 定义

// 清理脚本功能 - 由 moduleLoader 提供
// 此函数由 moduleLoader.js 定义
