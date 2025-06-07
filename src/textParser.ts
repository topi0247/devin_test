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
        
        processed = this.hideMarkdownHeaders(processed);
        processed = this.parseRuby(processed);
        processed = this.parseColors(processed);
        processed = this.parseBackgroundColors(processed);
        processed = this.convertToGridCells(processed, mode);
        
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
    
    private convertToGridCells(text: string, mode: 'horizontal' | 'vertical'): string {
        const lines = text.split('\n');
        const gridSize = this.settings.get('gridSize', 20);
        
        let gridHtml = `<div class="grid-container ${mode}-grid">`;
        
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            
            if (line.trim() === '') {
                gridHtml += `<div class="grid-line empty-line"></div>`;
                continue;
            }
            
            gridHtml += `<div class="grid-line">`;
            
            const characters = this.splitIntoCharacters(line);
            
            for (let charIndex = 0; charIndex < Math.min(characters.length, gridSize); charIndex++) {
                const char = characters[charIndex];
                if (char === ' ') {
                    gridHtml += `<div class="grid-cell empty-cell"></div>`;
                } else {
                    gridHtml += `<div class="grid-cell">${char}</div>`;
                }
            }
            
            for (let i = characters.length; i < gridSize; i++) {
                gridHtml += `<div class="grid-cell empty-cell"></div>`;
            }
            
            gridHtml += `</div>`;
        }
        
        gridHtml += `</div>`;
        return gridHtml;
    }
    
    private splitIntoCharacters(text: string): string[] {
        const characters: string[] = [];
        let i = 0;
        
        while (i < text.length) {
            if (text[i] === '<') {
                if (text.substring(i).startsWith('<ruby>')) {
                    const rubyEnd = text.indexOf('</ruby>', i);
                    if (rubyEnd !== -1) {
                        const rubyContent = text.substring(i, rubyEnd + 7);
                        const rubyMatch = rubyContent.match(/<ruby>([^<]+)<rt>([^<]+)<\/rt><\/ruby>/);
                        if (rubyMatch) {
                            const baseText = rubyMatch[1];
                            for (let j = 0; j < baseText.length; j++) {
                                characters.push(`<ruby>${baseText[j]}<rt>${rubyMatch[2]}</rt></ruby>`);
                            }
                        } else {
                            characters.push(rubyContent);
                        }
                        i = rubyEnd + 7;
                        continue;
                    }
                } else if (text.substring(i).startsWith('<span')) {
                    const spanEnd = text.indexOf('</span>', i);
                    if (spanEnd !== -1) {
                        const spanContent = text.substring(i, spanEnd + 7);
                        const spanMatch = spanContent.match(/<span[^>]*>([^<]+)<\/span>/);
                        if (spanMatch) {
                            const spanText = spanMatch[1];
                            const spanTag = spanContent.substring(0, spanContent.indexOf('>') + 1);
                            for (let j = 0; j < spanText.length; j++) {
                                characters.push(`${spanTag}${spanText[j]}</span>`);
                            }
                        } else {
                            characters.push(spanContent);
                        }
                        i = spanEnd + 7;
                        continue;
                    }
                }
            }
            
            characters.push(text[i]);
            i++;
        }
        
        return characters;
    }
}
