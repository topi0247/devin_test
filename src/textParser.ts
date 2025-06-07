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
                const tagEnd = text.indexOf('>', i);
                if (tagEnd !== -1) {
                    const tag = text.substring(i, tagEnd + 1);
                    if (tag.startsWith('<ruby>')) {
                        const rubyEnd = text.indexOf('</ruby>', tagEnd);
                        if (rubyEnd !== -1) {
                            characters.push(text.substring(i, rubyEnd + 7));
                            i = rubyEnd + 7;
                            continue;
                        }
                    } else if (tag.startsWith('<span')) {
                        const spanEnd = text.indexOf('</span>', tagEnd);
                        if (spanEnd !== -1) {
                            characters.push(text.substring(i, spanEnd + 7));
                            i = spanEnd + 7;
                            continue;
                        }
                    }
                }
            }
            
            characters.push(text[i]);
            i++;
        }
        
        return characters;
    }
}
