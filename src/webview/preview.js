const vscode = acquireVsCodeApi();

function applySettings(settings) {
    const root = document.documentElement;
    root.style.setProperty('--grid-size', settings.gridSize);
    root.style.setProperty('--cell-size', settings.cellSize + 'px');
    root.style.setProperty('--line-spacing', settings.lineSpacing + 'px');
    root.style.setProperty('--font-family', settings.fontFamily);
    
    Object.entries(settings.colors).forEach(([name, color]) => {
        root.style.setProperty(`--color-${name}`, color);
    });
    
    const content = document.getElementById('preview-content');
    if (settings.showGrid) {
        content.classList.add('show-grid');
    } else {
        content.classList.remove('show-grid');
    }
}

function updateContent(html, mode) {
    const container = document.getElementById('container');
    const content = document.getElementById('preview-content');
    
    container.className = mode + '-mode';
    content.innerHTML = html;
}

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'update':
            updateContent(message.html, message.mode);
            break;
        case 'settings':
            applySettings(message.settings);
            break;
    }
});
