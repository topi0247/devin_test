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
        vscode.workspace.onDidChangeTextDocument(this.onDocumentChange, this, this.disposables);
        vscode.window.onDidChangeActiveTextEditor(this.onActiveEditorChange, this, this.disposables);
        vscode.workspace.onDidChangeConfiguration(this.onConfigurationChange, this, this.disposables);
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
        if (this.panel && this.isRelevantDocument(event.document)) {
            this.updatePreview();
        }
    }
    onActiveEditorChange() {
        if (this.panel) {
            this.updatePreview();
        }
    }
    onConfigurationChange(event) {
        if (event.affectsConfiguration('novelPreview') && this.panel) {
            this.updatePreview();
        }
    }
    isRelevantDocument(document) {
        return document.languageId === 'markdown' || document.fileName.endsWith('.txt');
    }
    updatePreview() {
        if (!this.panel)
            return;
        const editor = vscode.window.activeTextEditor;
        if (!editor || !this.isRelevantDocument(editor.document)) {
            this.panel.webview.html = this.getWebviewContent('プレビューするファイルを選択してください');
            return;
        }
        const text = editor.document.getText();
        const parsedHtml = this.textParser.parse(text, this.currentMode);
        const settings = settingsManager_1.SettingsManager.getSettings();
        this.panel.webview.html = this.getWebviewContent(parsedHtml);
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
    getWebviewContent(content) {
        const webviewUri = this.panel.webview.asWebviewUri;
        const stylesUri = webviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'styles.css'));
        const scriptUri = webviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'preview.js'));
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel.webview.cspSource} 'unsafe-inline'; script-src ${this.panel.webview.cspSource};">
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
exports.PreviewProvider = PreviewProvider;
//# sourceMappingURL=previewProvider.js.map