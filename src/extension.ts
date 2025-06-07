import * as vscode from 'vscode';
import { PreviewProvider } from './previewProvider';

export function activate(context: vscode.ExtensionContext) {
    const previewProvider = new PreviewProvider(context);
    
    const horizontalCommand = vscode.commands.registerCommand(
        'novelPreview.showHorizontalPreview',
        () => previewProvider.showPreview('horizontal')
    );
    
    const verticalCommand = vscode.commands.registerCommand(
        'novelPreview.showVerticalPreview', 
        () => previewProvider.showPreview('vertical')
    );
    
    const toggleCommand = vscode.commands.registerCommand(
        'novelPreview.togglePreviewMode',
        () => previewProvider.toggleMode()
    );
    
    context.subscriptions.push(horizontalCommand, verticalCommand, toggleCommand);
}

export function deactivate() {}
