// sidebarDrag.ts —— 100% 正确版本
type ResizeDirection = 'left' | 'right' | 'bottom' | 'top';

interface ResizeOptions {
    minSize?: number;
    maxSize?: number;
}

class ResizablePanel {
    private isDragging = false;
    private startPos = 0;
    private startSize = 0;

    constructor(
        private readonly panel: HTMLElement,
        private readonly handle: HTMLElement,
        private readonly direction: ResizeDirection,
        private readonly options: ResizeOptions = {}
    ) {
        this.handle.dataset.resize = direction;
        this.bindEvents();
    }

    private bindEvents(): void {
        this.handle.addEventListener('pointerdown', this.onPointerDown);
    }

    private readonly onPointerDown = (e: PointerEvent): void => {
        if (e.button !== 0) return;
        e.preventDefault();
        this.handle.setPointerCapture(e.pointerId);

        this.isDragging = true;
        this.startPos = this.isHorizontal ? e.clientX : e.clientY;
        const rect = this.panel.getBoundingClientRect();
        this.startSize = this.isHorizontal ? rect.width : rect.height;

        document.body.style.cursor = this.isHorizontal ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';

        document.addEventListener('pointermove', this.onPointerMove);
        document.addEventListener('pointerup', this.onPointerUp);
        document.addEventListener('pointercancel', this.onPointerUp);
    };

    private readonly onPointerMove = (e: PointerEvent): void => {
        if (!this.isDragging) return;

        const clientPos = this.isHorizontal ? e.clientX : e.clientY;
        let delta = clientPos - this.startPos;
        if (this.direction === 'right' || this.direction === 'top') delta = -delta;

        let newSize = this.startSize + delta;
        const min = this.options.minSize ?? 38;
        const max = this.options.maxSize ?? Infinity;
        newSize = Math.max(min, Math.min(newSize, max));

        if (this.isHorizontal) {
            this.panel.style.width = `${newSize}px`;
        } else {
            this.panel.style.height = `${newSize}px`;
        }
    };

    private readonly onPointerUp = (): void => {
        if (!this.isDragging) return;
        this.isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('pointermove', this.onPointerMove);
        document.removeEventListener('pointerup', this.onPointerUp);
        document.removeEventListener('pointercancel', this.onPointerUp);
    };

    private get isHorizontal(): boolean {
        return this.direction === 'left' || this.direction === 'right';
    }

    public dispose(): void {
        this.handle.removeEventListener('pointerdown', this.onPointerDown);
        this.onPointerUp();
    }
}

export const DragManager = (() => {
    const _instances: ResizablePanel[] = [];
    let _resizeHandler: (() => void) | null = null;

    const _onWindowResize = () => {
        for (const inst of _instances) {
            const panel = (inst as any).panel as HTMLElement;
            const options = (inst as any).options as ResizeOptions;
            const minSize = options.minSize ?? 38;
            const rect = panel.getBoundingClientRect();
            const current = rect.width > 0 ? rect.width : rect.height;

            if (current < minSize) {
                if (rect.width > 0) panel.style.width = `${minSize}px`;
                if (rect.height > 0) panel.style.height = `${minSize}px`;
            }
        }
    };

    return {
        init(container: HTMLElement | Document = document): void {
            this.destroy();

            const handles = container.querySelectorAll<HTMLElement>('[data-resize]');
            handles.forEach(handle => {
                const direction = handle.dataset.resize as ResizeDirection;
                if (!direction || !['left', 'right', 'bottom', 'top'].includes(direction)) {
                    console.warn('Invalid data-resize:', direction);
                    return;
                }

                let panel: HTMLElement | null = null;

                if (direction === 'left' || direction === 'right') {
                    panel = handle.previousElementSibling as HTMLElement;
                    if (!panel || panel.getBoundingClientRect().width === 0) {
                        panel = handle.parentElement?.firstElementChild as HTMLElement;
                    }
                }

                if (direction === 'bottom' || direction === 'top') {
                    panel = handle.nextElementSibling as HTMLElement;
                    if (!panel || panel.getBoundingClientRect().height === 0) {
                        panel = handle.parentElement?.querySelector('.bottom-panel, [class*="bottom"], [id*="bottom"]') as HTMLElement;
                    }
                }

                if (!panel) {
                    console.warn('No panel found for resize handle:', handle);
                    return;
                }

                const minSize = handle.dataset.minSize || panel.dataset.minSize
                    ? Math.max(38, Number.parseInt(handle.dataset.minSize || panel.dataset.minSize || '38', 10))
                    : 38;

                _instances.push(new ResizablePanel(panel, handle, direction, { minSize }));
            });

            _resizeHandler = _onWindowResize;
            window.addEventListener('resize', _resizeHandler);
        },

        destroy(): void {
            _instances.forEach(inst => inst.dispose());
            _instances.length = 0;
            if (_resizeHandler) {
                window.removeEventListener('resize', _resizeHandler);
                _resizeHandler = null;
            }
        }
    };
})();