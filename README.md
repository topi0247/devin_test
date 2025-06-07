# Novel Writing Preview Extension

VS Code拡張機能：小説執筆用の横書き・縦書きプレビュー

## 機能

- **横書きプレビュー**: 通常の横書き表示でマークダウン・テキストファイルをプレビュー
- **縦書きプレビュー**: 日本語小説に適した縦書き表示
- **リアルタイム更新**: エディタの内容変更に合わせてプレビューが自動更新
- **特殊記法サポート**:
  - ルビ記法: `[rb:漢字:かんじ]` → <ruby>漢字<rt>かんじ</rt></ruby>
  - 色指定: `[color-red:赤い文字]` → 赤色で表示
  - 背景色: `[bg-color-blue:青背景]` → 青い背景で表示
- **原稿用紙グリッド**: マス目表示で文字数管理
- **設定カスタマイズ**: フォント、マス数、色設定など

## 使用方法

1. マークダウン（.md）またはテキスト（.txt）ファイルを開く
2. 右クリックメニューから以下を選択:
   - 「横書きプレビューを開く」
   - 「縦書きプレビューを開く」
3. コマンドパレット（Ctrl+Shift+P）から:
   - `Novel Preview: 横書きプレビューを開く`
   - `Novel Preview: 縦書きプレビューを開く`
   - `Novel Preview: プレビューモード切り替え`

## 設定

VS Codeの設定（settings.json）で以下をカスタマイズ可能:

```json
{
  "novelPreview.gridSize": 20,
  "novelPreview.cellSize": 24,
  "novelPreview.lineSpacing": 4,
  "novelPreview.fontFamily": "游明朝, YuMincho, Hiragino Mincho ProN, serif",
  "novelPreview.showGrid": true,
  "novelPreview.colors": {
    "red": "#ff0000",
    "blue": "#0000ff",
    "green": "#008000",
    "yellow": "#ffff00"
  }
}
```

## 開発

```bash
npm install
npm run compile
```

F5キーでExtension Development Hostを起動してテスト可能。

## 特殊記法例

```
# 小説のタイトル

これは[rb:漢字:かんじ]のルビ記法です。

[color-red:赤い文字]で強調したり、[bg-color-yellow:黄色い背景]で目立たせることができます。

縦書きモードでは見出しが非表示になります。
```
