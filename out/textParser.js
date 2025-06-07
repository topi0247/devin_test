"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextParser = void 0;
const vscode = require("vscode");
class TextParser {
    constructor() {
        this.updateSettings();
    }
    updateSettings() {
        this.settings = vscode.workspace.getConfiguration('novelPreview');
    }
    parse(text, mode) {
        let processed = text;
        if (mode === 'vertical') {
            processed = this.hideMarkdownHeaders(processed);
        }
        processed = this.parseRuby(processed);
        processed = this.parseColors(processed);
        processed = this.parseBackgroundColors(processed);
        processed = this.convertLineBreaks(processed);
        return processed;
    }
    hideMarkdownHeaders(text) {
        return text.replace(/^#+\s+.*$/gm, '');
    }
    parseRuby(text) {
        return text.replace(/\[rb:([^:]+):([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
    }
    parseColors(text) {
        const colors = this.settings.get('colors', {});
        let result = text;
        Object.keys(colors).forEach(colorName => {
            const regex = new RegExp(`\\[color-${colorName}:([^\\]]+)\\]`, 'g');
            result = result.replace(regex, `<span class="text-color-${colorName}">$1</span>`);
        });
        return result;
    }
    parseBackgroundColors(text) {
        const colors = this.settings.get('colors', {});
        let result = text;
        Object.keys(colors).forEach(colorName => {
            const regex = new RegExp(`\\[bg-color-${colorName}:([^\\]]+)\\]`, 'g');
            result = result.replace(regex, `<span class="bg-color-${colorName}">$1</span>`);
        });
        return result;
    }
    convertLineBreaks(text) {
        return text.replace(/\n/g, '<br>');
    }
}
exports.TextParser = TextParser;
//# sourceMappingURL=textParser.js.map