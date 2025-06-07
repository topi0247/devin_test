import * as vscode from 'vscode';

export class TextParser {
    private settings: any;
    
    constructor() {
        this.updateSettings();
    }
    
    public updateSettings() {
        this.settings = vscode.workspace.getConfiguration('novelPreview');
    }
    
    public parse(text: string, mode: 'horizontal' | 'vertical'): string {
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
    
    private hideMarkdownHeaders(text: string): string {
        return text.replace(/^#+\s+.*$/gm, '');
    }
    
    private parseRuby(text: string): string {
        return text.replace(/\[rb:([^:]+):([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
    }
    
    private parseColors(text: string): string {
        const colors = this.settings.get('colors', {});
        let result = text;
        
        Object.keys(colors).forEach(colorName => {
            const regex = new RegExp(`\\[color-${colorName}:([^\\]]+)\\]`, 'g');
            result = result.replace(regex, `<span class="text-color-${colorName}">$1</span>`);
        });
        
        return result;
    }
    
    private parseBackgroundColors(text: string): string {
        const colors = this.settings.get('colors', {});
        let result = text;
        
        Object.keys(colors).forEach(colorName => {
            const regex = new RegExp(`\\[bg-color-${colorName}:([^\\]]+)\\]`, 'g');
            result = result.replace(regex, `<span class="bg-color-${colorName}">$1</span>`);
        });
        
        return result;
    }
    
    private convertLineBreaks(text: string): string {
        return text.replace(/\n/g, '<br>');
    }
}
