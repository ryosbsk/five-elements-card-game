# 背景画像ディレクトリ

このディレクトリはELEMENTALカードゲームの背景画像用です。

## 使用方法

### 推奨画像サイズ
- **デスクトップ用**: 1920x1080px
- **タブレット用**: 1024x768px  
- **スマホ横向け用**: 844x390px (iPhone 14 Pro相当)

### ファイル命名規則
- `bg-desktop.jpg` - デスクトップ用背景
- `bg-tablet.jpg` - タブレット用背景  
- `bg-mobile-landscape.jpg` - スマホ横向け用背景

### CSS設定例
```css
body {
    background-image: url('./backgrounds/bg-desktop.jpg');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}

@media (max-width: 1024px) {
    body {
        background-image: url('./backgrounds/bg-tablet.jpg');
    }
}

@media (orientation: landscape) and (max-height: 500px) {
    body {
        background-image: url('./backgrounds/bg-mobile-landscape.jpg');
    }
}
```

## 五行テーマ画像案

### 推奨テーマ
- **木**: 森林、竹林、桜の木など自然の緑
- **火**: 夕焼け、炎、溶岩、赤い空
- **土**: 大地、山脈、砂漠、茶色の風景  
- **金**: 鉱物、金属的な光沢、黄金色の風景
- **水**: 海、湖、滝、青い空と雲

### 画像の設置
1. 適切なサイズの画像をこのディレクトリに配置
2. style.cssで背景設定を適用
3. ゲームのトーンに合わせて透明度調整

現在は透明度の高いグラデーション背景を使用中です🌸