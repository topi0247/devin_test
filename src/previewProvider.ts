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
        
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(this.onDocumentChange, this),
            vscode.window.onDidChangeActiveTextEditor(this.onActiveEditorChange, this),
            vscode.workspace.onDidChangeConfiguration(this.onConfigurationChange, this)
        );
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
        try {
            if (this.panel && this.isRelevantDocument(event.document)) {
                this.updatePreview();
            }
        } catch (error) {
            console.error('Error in onDocumentChange:', error);
        }
    }
    
    private onActiveEditorChange() {
        try {
            if (this.panel) {
                this.updatePreview();
            }
        } catch (error) {
            console.error('Error in onActiveEditorChange:', error);
        }
    }
    
    private onConfigurationChange(event: vscode.ConfigurationChangeEvent) {
        try {
            if (event.affectsConfiguration('novelPreview') && this.panel) {
                this.updatePreview();
            }
        } catch (error) {
            console.error('Error in onConfigurationChange:', error);
        }
    }
    
    private isRelevantDocument(document: vscode.TextDocument): boolean {
        return document.languageId === 'markdown' || document.fileName.endsWith('.txt');
    }
    
    private updatePreview() {
        try {
            if (!this.panel) return;
            
            const editor = vscode.window.activeTextEditor;
            if (!editor || !this.isRelevantDocument(editor.document)) {
                this.panel.webview.html = this.getWebviewContent('プレビューするファイルを選択してください');
                return;
            }
            
            const text = editor.document.getText();
            this.textParser.updateSettings();
            const parsedHtml = this.textParser.parse(text, this.currentMode);
            const settings = SettingsManager.getSettings();
            
            this.panel.webview.html = this.getWebviewContent(parsedHtml);
            
            setTimeout(() => {
                if (this.panel) {
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
            }, 100);
        } catch (error) {
            console.error('Error in updatePreview:', error);
        }
    }
    
    private getWebviewContent(content: string): string {
        if (!this.panel) {
            return '';
        }
        
        const webviewUri = this.panel.webview.asWebviewUri;
        const stylesUri = webviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'styles.css'));
        const scriptUri = webviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'preview.js'));
        
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel!.webview.cspSource} 'unsafe-inline'; script-src ${this.panel!.webview.cspSource};">
            <title>Novel Preview</title>
            <link rel="stylesheet" href="${stylesUri}">
        </head>
        <body>
            <div id="container" class="${this.currentMode}-mode">
                <div id="preview-content" class="manuscript-paper">
                    ${content}
                </div>
            </div>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}
