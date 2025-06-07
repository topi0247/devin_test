"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewProvider = void 0;
const vscode = require("vscode");
const textParser_1 = require("./textParser");
const settingsManager_1 = require("./settingsManager");
class PreviewProvider {
    constructor(context) {
        this.context = context;
        this.currentMode = 'horizontal';
        this.disposables = [];
        this.textParser = new textParser_1.TextParser();
        const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
            this.onDocumentChange(event);
        });
        const editorChangeListener = vscode.window.onDidChangeActiveTextEditor(() => {
            this.onActiveEditorChange();
        });
        const configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => {
            this.onConfigurationChange(event);
        });
        this.disposables.push(documentChangeListener, editorChangeListener, configChangeListener);
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
        }
    }
    showPreview(mode) {
        this.currentMode = mode;
        if (this.panel) {
            this.panel.reveal();
        }
        else {
            this.panel = vscode.window.createWebviewPanel('novelPreview', `Novel Preview (${mode === 'horizontal' ? '横書き' : '縦書き'})`, vscode.ViewColumn.Beside, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            }, null, this.disposables);
        }
        this.updatePreview();
    }
    toggleMode() {
        if (this.panel) {
            this.currentMode = this.currentMode === 'horizontal' ? 'vertical' : 'horizontal';
            this.panel.title = `Novel Preview (${this.currentMode === 'horizontal' ? '横書き' : '縦書き'})`;
            this.updatePreview();
        }
    }
    onDocumentChange(event) {
        setImmediate(() => {
            try {
                if (!event || !event.document) {
                    return;
                }
                if (!this.panel || this.disposables.length === 0) {
                    return;
                }
                if (this.isRelevantDocument(event.document)) {
                    this.updatePreview();
                }
            }
            catch (error) {
                console.error('Error in onDocumentChange:', error);
            }
        });
    }
    onActiveEditorChange() {
        setImmediate(() => {
            try {
                if (!this.panel || this.disposables.length === 0) {
                    return;
                }
                this.updatePreview();
            }
            catch (error) {
                console.error('Error in onActiveEditorChange:', error);
            }
        });
    }
    onConfigurationChange(event) {
        setImmediate(() => {
            try {
                if (!this.panel || this.disposables.length === 0) {
                    return;
                }
                if (event && event.affectsConfiguration('novelPreview')) {
                    this.updatePreview();
                }
            }
            catch (error) {
                console.error('Error in onConfigurationChange:', error);
            }
        });
    }
    isRelevantDocument(document) {
        return document.languageId === 'markdown' || document.fileName.endsWith('.txt');
    }
    updatePreview() {
        try {
            if (!this.panel || this.panel.webview === undefined) {
                console.log('Panel or webview is undefined, skipping update');
                return;
            }
            const editor = vscode.window.activeTextEditor;
            if (!editor || !this.isRelevantDocument(editor.document)) {
                const fallbackContent = this.getWebviewContent('プレビューするファイルを選択してください');
                if (fallbackContent) {
                    this.panel.webview.html = fallbackContent;
                }
                return;
            }
            const text = editor.document.getText();
            if (this.textParser) {
                this.textParser.updateSettings();
            }
            const parsedHtml = this.textParser ? this.textParser.parse(text, this.currentMode) : text;
            let settings;
            try {
                settings = settingsManager_1.SettingsManager.getSettings();
            }
            catch (settingsError) {
                console.error('Error getting settings:', settingsError);
                settings = {
                    gridSize: 20,
                    cellSize: 24,
                    lineSpacing: 4,
                    fontFamily: '游明朝, YuMincho, Hiragino Mincho ProN, serif',
                    showGrid: true,
                    colors: {
                        red: '#ff0000',
                        blue: '#0000ff',
                        green: '#008000',
                        yellow: '#ffff00'
                    }
                };
            }
            const webviewContent = this.getWebviewContent(parsedHtml);
            if (webviewContent && this.panel && this.panel.webview) {
                this.panel.webview.html = webviewContent;
                setTimeout(() => {
                    try {
                        if (this.panel && this.panel.webview) {
                            this.panel.webview.postMessage({
                                command: 'update',
                                html: parsedHtml,
                                mode: this.currentMode
                            });
                            this.panel.webview.postMessage({
                                command: 'settings',
                                settings: settings
                            });
                        }
                    }
                    catch (messageError) {
                        console.error('Error sending webview messages:', messageError);
                    }
                }, 100);
            }
        }
        catch (error) {
            console.error('Error in updatePreview:', error);
            if (this.panel && this.panel.webview) {
                try {
                    this.panel.webview.html = '<html><body><h1>Preview Error</h1><p>An error occurred while updating the preview.</p></body></html>';
                }
                catch (htmlError) {
                    console.error('Error setting fallback HTML:', htmlError);
                }
            }
        }
    }
    getWebviewContent(content) {
        try {
            if (!this.panel || !this.panel.webview) {
                console.log('Panel or webview is undefined in getWebviewContent');
                return this.getFallbackContent(content);
            }
            const cspSource = this.panel.webview.cspSource;
            return `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource || 'vscode-webview:'} 'unsafe-inline'; script-src ${cspSource || 'vscode-webview:'} 'unsafe-inline';">
                <title>Novel Preview</title>
                <style>
                    :root {
                        --grid-size: 20;
                        --cell-size: 24px;
                        --line-spacing: 4px;
                        --font-family: '游明朝', YuMincho, 'Hiragino Mincho ProN', serif;
                        --color-red: #ff0000;
                        --color-blue: #0000ff;
                        --color-green: #008000;
                        --color-yellow: #ffff00;
                    }
                    
                    body { 
                        font-family: var(--font-family); 
                        padding: 20px; 
                        margin: 0;
                        background-color: #ffffff;
                    }
                    
                    .horizontal-mode { 
                        writing-mode: horizontal-tb; 
                        direction: ltr;
                    }
                    
                    .vertical-mode { 
                        writing-mode: vertical-rl; 
                        text-orientation: upright; 
                        direction: rtl;
                    }
                    
                    .manuscript-paper { 
                        padding: 10px;
                        min-height: 400px;
                    }
                    
                    .grid-container {
                        display: flex;
                        flex-direction: column;
                        gap: 0;
                    }
                    
                    .horizontal-grid {
                        flex-direction: column;
                    }
                    
                    .vertical-grid {
                        flex-direction: row;
                        writing-mode: vertical-rl;
                        text-orientation: upright;
                    }
                    
                    .grid-line {
                        display: flex;
                        gap: 0;
                    }
                    
                    .horizontal-grid .grid-line {
                        flex-direction: row;
                    }
                    
                    .vertical-grid .grid-line {
                        flex-direction: column;
                    }
                    
                    .grid-cell {
                        width: var(--cell-size);
                        height: var(--cell-size);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: var(--font-family);
                        font-size: calc(var(--cell-size) * 0.7);
                        position: relative;
                        box-sizing: border-box;
                    }
                    
                    .manuscript-paper.show-grid .grid-cell {
                        border: 1px solid #ddd;
                    }
                    
                    .empty-cell {
                        color: transparent;
                    }
                    
                    .empty-line {
                        height: var(--cell-size);
                    }
                    
                    .grid-container {
                        display: flex;
                        flex-direction: column;
                        gap: 0;
                    }
                    
                    .horizontal-grid {
                        flex-direction: column;
                    }
                    
                    .vertical-grid {
                        flex-direction: row;
                        writing-mode: vertical-rl;
                        text-orientation: upright;
                    }
                    
                    .grid-line {
                        display: flex;
                        gap: 0;
                    }
                    
                    .horizontal-grid .grid-line {
                        flex-direction: row;
                    }
                    
                    .vertical-grid .grid-line {
                        flex-direction: column;
                    }
                    
                    .grid-cell {
                        width: var(--cell-size);
                        height: var(--cell-size);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: var(--font-family);
                        font-size: calc(var(--cell-size) * 0.7);
                        position: relative;
                        box-sizing: border-box;
                    }
                    
                    .manuscript-paper.show-grid .grid-cell {
                        border: 1px solid #ddd;
                    }
                    
                    .empty-cell {
                        color: transparent;
                    }
                    
                    .empty-line {
                        height: var(--cell-size);
                    }
                    
                    ruby rt { font-size: 0.5em; }
                    
                    .text-color-red { color: var(--color-red); }
                    .text-color-blue { color: var(--color-blue); }
                    .text-color-green { color: var(--color-green); }
                    .text-color-yellow { color: var(--color-yellow); }
                    
                    .bg-color-red { background-color: var(--color-red); }
                    .bg-color-blue { background-color: var(--color-blue); }
                    .bg-color-green { background-color: var(--color-green); }
                    .bg-color-yellow { background-color: var(--color-yellow); }
                </style>
            </head>
            <body>
                <div id="container" class="${this.currentMode}-mode">
                    <div id="preview-content" class="manuscript-paper">
                        ${content || 'プレビューコンテンツがありません'}
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function applySettings(settings) {
                        const root = document.documentElement;
                        
                        if (settings.gridSize) {
                            root.style.setProperty('--grid-size', settings.gridSize);
                        }
                        if (settings.cellSize) {
                            root.style.setProperty('--cell-size', settings.cellSize + 'px');
                        }
                        if (settings.lineSpacing) {
                            root.style.setProperty('--line-spacing', settings.lineSpacing + 'px');
                        }
                        if (settings.fontFamily) {
                            root.style.setProperty('--font-family', settings.fontFamily);
                        }
                        
                        const content = document.getElementById('preview-content');
                        if (content) {
                            if (settings.showGrid) {
                                content.classList.add('show-grid');
                            } else {
                                content.classList.remove('show-grid');
                            }
                        }
                        
                        if (settings.colors) {
                            Object.entries(settings.colors).forEach(function(entry) {
                                const name = entry[0];
                                const color = entry[1];
                                root.style.setProperty('--color-' + name, color);
                            });
                        }
                    }
                    
                    function updateContent(html, mode) {
                        const container = document.getElementById('container');
                        const content = document.getElementById('preview-content');
                        
                        if (container && content) {
                            container.className = mode + '-mode';
                            content.innerHTML = html || 'コンテンツがありません';
                        }
                    }
                    
                    window.addEventListener('message', function(event) {
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
                </script>
            </body>
            </html>`;
        }
        catch (error) {
            console.error('Error in getWebviewContent:', error);
            return this.getFallbackContent(content);
        }
    }
    getFallbackContent(content) {
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Novel Preview</title>
            <style>
                body { font-family: serif; padding: 20px; }
                .horizontal-mode { writing-mode: horizontal-tb; }
                .vertical-mode { writing-mode: vertical-rl; text-orientation: upright; }
            </style>
        </head>
        <body>
            <div class="${this.currentMode}-mode">
                <div>${content || 'プレビューエラー'}</div>
            </div>
        </body>
        </html>`;
    }
}
exports.PreviewProvider = PreviewProvider;
//# sourceMappingURL=previewProvider.js.map