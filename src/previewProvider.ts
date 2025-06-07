import * as vscode from 'vscode';
import { TextParser } from './textParser';
import { SettingsManager } from './settingsManager';

export class PreviewProvider implements vscode.Disposable {
    private panel: vscode.WebviewPanel | undefined;
    private currentMode: 'horizontal' | 'vertical' = 'horizontal';
    private disposables: vscode.Disposable[] = [];
    private textParser: TextParser;
    
    constructor(private context: vscode.ExtensionContext) {
        this.textParser = new TextParser();
        
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
    
    public dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
        }
    }
    
    public showPreview(mode: 'horizontal' | 'vertical') {
        this.currentMode = mode;
        
        if (this.panel) {
            this.panel.reveal();
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'novelPreview',
                `Novel Preview (${mode === 'horizontal' ? '横書き' : '縦書き'})`,
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            }, null, this.disposables);
        }
        
        this.updatePreview();
    }
    
    public toggleMode() {
        if (this.panel) {
            this.currentMode = this.currentMode === 'horizontal' ? 'vertical' : 'horizontal';
            this.panel.title = `Novel Preview (${this.currentMode === 'horizontal' ? '横書き' : '縦書き'})`;
            this.updatePreview();
        }
    }
    
    private onDocumentChange(event: vscode.TextDocumentChangeEvent) {
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
            } catch (error) {
                console.error('Error in onDocumentChange:', error);
            }
        });
    }
    
    private onActiveEditorChange() {
        setImmediate(() => {
            try {
                if (!this.panel || this.disposables.length === 0) {
                    return;
                }
                
                this.updatePreview();
            } catch (error) {
                console.error('Error in onActiveEditorChange:', error);
            }
        });
    }
    
    private onConfigurationChange(event: vscode.ConfigurationChangeEvent) {
        setImmediate(() => {
            try {
                if (!this.panel || this.disposables.length === 0) {
                    return;
                }
                
                if (event && event.affectsConfiguration('novelPreview')) {
                    this.updatePreview();
                }
            } catch (error) {
                console.error('Error in onConfigurationChange:', error);
            }
        });
    }
    
    private isRelevantDocument(document: vscode.TextDocument): boolean {
        return document.languageId === 'markdown' || document.fileName.endsWith('.txt');
    }
    
    private updatePreview() {
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
            
            let settings: any;
            try {
                settings = SettingsManager.getSettings();
            } catch (settingsError) {
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
                    } catch (messageError) {
                        console.error('Error sending webview messages:', messageError);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error in updatePreview:', error);
            if (this.panel && this.panel.webview) {
                try {
                    this.panel.webview.html = '<html><body><h1>Preview Error</h1><p>An error occurred while updating the preview.</p></body></html>';
                } catch (htmlError) {
                    console.error('Error setting fallback HTML:', htmlError);
                }
            }
        }
    }
    
    private getWebviewContent(content: string): string {
        try {
            if (!this.panel || !this.panel.webview) {
                console.log('Panel or webview is undefined in getWebviewContent');
                return '';
            }
            
            const webviewUri = this.panel.webview.asWebviewUri;
            if (!webviewUri) {
                console.error('webviewUri is undefined');
                return this.getFallbackContent(content);
            }
            
            let stylesUri, scriptUri;
            try {
                stylesUri = webviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'styles.css'));
                scriptUri = webviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'preview.js'));
            } catch (uriError) {
                console.error('Error creating webview URIs:', uriError);
                return this.getFallbackContent(content);
            }
            
            const cspSource = this.panel.webview.cspSource;
            if (!cspSource) {
                console.error('CSP source is undefined');
                return this.getFallbackContent(content);
            }
            
            return `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource};">
                <title>Novel Preview</title>
                <style>
                    body { font-family: '游明朝', YuMincho, 'Hiragino Mincho ProN', serif; padding: 20px; }
                    .horizontal-mode { writing-mode: horizontal-tb; }
                    .vertical-mode { writing-mode: vertical-rl; text-orientation: upright; }
                    .manuscript-paper { line-height: 1.8; }
                    ruby rt { font-size: 0.5em; }
                    .text-color-red { color: #ff0000; }
                    .text-color-blue { color: #0000ff; }
                    .text-color-green { color: #008000; }
                    .text-color-yellow { color: #ffff00; }
                    .bg-color-red { background-color: #ff0000; }
                    .bg-color-blue { background-color: #0000ff; }
                    .bg-color-green { background-color: #008000; }
                    .bg-color-yellow { background-color: #ffff00; }
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
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'update':
                                const container = document.getElementById('container');
                                const content = document.getElementById('preview-content');
                                if (container && content) {
                                    container.className = message.mode + '-mode';
                                    content.innerHTML = message.html || 'コンテンツがありません';
                                }
                                break;
                        }
                    });
                </script>
            </body>
            </html>`;
        } catch (error) {
            console.error('Error in getWebviewContent:', error);
            return this.getFallbackContent(content);
        }
    }
    
    private getFallbackContent(content: string): string {
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
