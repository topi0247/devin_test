import * as vscode from 'vscode';

export class SettingsManager {
    public static getSettings() {
        const config = vscode.workspace.getConfiguration('novelPreview');
        return {
            gridSize: config.get('gridSize', 20),
            cellSize: config.get('cellSize', 24),
            lineSpacing: config.get('lineSpacing', 4),
            fontFamily: config.get('fontFamily', '游明朝, YuMincho, Hiragino Mincho ProN, serif'),
            showGrid: config.get('showGrid', true),
            colors: config.get('colors', {
                red: '#ff0000',
                blue: '#0000ff',
                green: '#008000',
                yellow: '#ffff00'
            })
        };
    }
}
