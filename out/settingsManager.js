"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsManager = void 0;
const vscode = require("vscode");
class SettingsManager {
    static getSettings() {
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
exports.SettingsManager = SettingsManager;
//# sourceMappingURL=settingsManager.js.map