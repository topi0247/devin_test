"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const previewProvider_1 = require("./previewProvider");
function activate(context) {
    const previewProvider = new previewProvider_1.PreviewProvider(context);
    const horizontalCommand = vscode.commands.registerCommand('novelPreview.showHorizontalPreview', () => previewProvider.showPreview('horizontal'));
    const verticalCommand = vscode.commands.registerCommand('novelPreview.showVerticalPreview', () => previewProvider.showPreview('vertical'));
    const toggleCommand = vscode.commands.registerCommand('novelPreview.togglePreviewMode', () => previewProvider.toggleMode());
    context.subscriptions.push(horizontalCommand, verticalCommand, toggleCommand);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map