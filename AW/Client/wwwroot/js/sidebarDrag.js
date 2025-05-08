function initSidebarDrag() {
    /*
     * 侧边栏拖拽
     */

    const SELECTORS = {
        main: 'main',
        sidebar: '#draggable-sidebar',
        resizeHandle: '.resize-handle'
    }

    const DIMENSIONS = {
        minWidth: 210,
        maxWidth: 400
    }

    const main = document.querySelector(SELECTORS.main);
    const sidebar = document.querySelector(SELECTORS.sidebar);
    const resizeHandle = sidebar.querySelector(SELECTORS.resizeHandle);

    if (!sidebar || !resizeHandle || !main) {
        console.error('Drag elements not found', { main, resizeHandle, sidebar });
        return () => { };
    }

    let isDragging = false;
    let startX = 0;
    let startWidth = 0;
    let translateX = 0;
    let newWidth = 0;

    const handleMouseDown = function (e) {
        isDragging = true;
        startX = e.clientX;
        startWidth = parseInt(window.getComputedStyle(sidebar).width, 10);

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    };

    const handleMouseMove = function (e) {
        if (!isDragging) return;

        // 侧边栏宽度： 210 ~ 400 px
        newWidth = Math.max(
            DIMENSIONS.minWidth,
            Math.min(DIMENSIONS.maxWidth, startWidth + e.clientX - startX));
        translateX = newWidth - startWidth;

        resizeHandle.style.transform = `translateX(${translateX}px)`;
    };

    const handleMouseUp = function (e) {
        if (!isDragging) return;
        isDragging = false;

        requestAnimationFrame(() => {
            sidebar.style.width = `${newWidth}px`;
            main.style.marginLeft = `${newWidth}px`;
        });

        resizeHandle.style.transform = '';
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };

    resizeHandle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);
}

window.initSidebarDrag = initSidebarDrag;