# 五行カードバトル 開発ビジョン

このドキュメントは、五行カードバトルの核心的なアイデアと実装計画を記録します。

## 🌟 ゲームの理念・コンセプト

### 核心的革新システム：「攻撃 vs PP生成」選択
**従来のカードゲームにない革新的なシステム**
- 場に出たカードが行動時に「攻撃」または「PP生成」を選択可能
- FF10風スピードシステムで各カードの行動順序を決定
- PP生成により新しいカードを召喚するためのリソースを確保
- **戦略性の核心**: 攻撃で即座の効果 vs PP生成で将来への投資

### 五行思想の戦略的活用
**古典的概念のモダンな応用**
- **相生関係**: 木→火→土→金→水→木（支援効果）
- **相克関係**: 木→土→水→火→金→木（対抗効果）
- 単なる属性ではなく、戦略の軸となる思想体系

### 設計哲学
1. **直感的でありながら戦略的**：誰でも理解できるが奥が深い
2. **短期と長期の選択**：即効性 vs 持続性のジレンマ
3. **リソース管理の重要性**：PPを「攻撃」に使うか「将来」に投資するか

## 🚀 段階的実装計画

### Phase 1: 基本戦闘システム ✅ **完了**
- **3vs3戦闘場**: 最大3枚のカード配置
- **PPシステム**: 毎ターンPP+1（上限5）
- **スピード順戦闘**: 配置されたカードをスピード順で攻撃
- **勝利条件**: 敵カード合計5コスト分を撃破
- **基本UI**: 手札表示、戦闘場、攻撃選択システム

**実装されたカードデータ（10枚）**
```javascript
// コスト1カード（5枚）- 合計ステータス60
{ name: "若芽", element: "木", hp: 25, attack: 25, speed: 10, cost: 1 }
{ name: "火花", element: "火", hp: 15, attack: 35, speed: 10, cost: 1 }
{ name: "小石", element: "土", hp: 40, attack: 10, speed: 10, cost: 1 }
{ name: "鋼片", element: "金", hp: 15, attack: 25, speed: 20, cost: 1 }
{ name: "水滴", element: "水", hp: 15, attack: 15, speed: 30, cost: 1 }

// コスト2カード（5枚）- 合計ステータス90
{ name: "森の精", element: "木", hp: 35, attack: 35, speed: 20, cost: 2 }
{ name: "炎の鳥", element: "火", hp: 25, attack: 50, speed: 15, cost: 2 }
{ name: "岩の巨人", element: "土", hp: 60, attack: 15, speed: 15, cost: 2 }
{ name: "鋼の狼", element: "金", hp: 25, attack: 35, speed: 30, cost: 2 }
{ name: "水の精霊", element: "水", hp: 25, attack: 25, speed: 40, cost: 2 }
```

### Phase 2: 革新的選択システム 🎯 **次の目標**
**「攻撃 vs PP生成」の実装**
- カードの行動時に二択を提示するUI
- PP生成選択時：+1PP、手札+1枚
- 攻撃選択時：従来通りのダメージ処理
- 戦略的意思決定の深化

**技術的課題**
- 分割クリックUIの実装
- AIの選択判断ロジック
- PP生成のバランス調整

### Phase 3: 五行相剋システム 🌀 **将来実装**
**属性間の相互作用**
- **相生効果**: 相生関係の味方がいると攻撃力+20%
- **相克効果**: 相克関係の敵に対して攻撃力+50%
- **属性組み合わせ戦略**: チーム編成の重要性向上

**実装内容**
- 相剋関係の判定システム
- ダメージ計算の拡張
- UI上での相剋表示

### Phase 4: 高度なシステム 🔮 **長期目標**
**ゲームの完成度向上**
- **動的カード生成**: ランダムステータスのカード
- **高度なAI**: 相剋を考慮した戦略判断
- **バランス調整**: プレイデータに基づく調整
- **アニメーション**: カード召喚・攻撃エフェクト

## 💡 設計原則

### 開発優先度
1. **動作する基本システム** > 豊富な機能
2. **直感的な操作性** > 複雑なメカニクス
3. **戦略的深度** > 視覚的派手さ
4. **段階的完成** > 一括実装

### 技術方針
- **バニラJavaScript**: シンプルで理解しやすい
- **イベントドリブン**: ユーザー操作中心の設計
- **状態管理**: 中央集権的なgameStateオブジェクト
- **デバッグ重視**: 豊富なログとエラーハンドリング

### バランス設計
- **コスト効率**: 高コストカードほど総ステータスが高い
- **属性特色**: 各属性に明確な役割分担
- **戦略選択**: 複数の勝利パターンを用意

## 🎯 成功指標

### Phase 1での達成目標 ✅
- [x] 基本的なゲームサイクルの完成
- [x] 直感的なUI操作の実現
- [x] 敵AIの基本的な思考
- [x] エラーのないゲーム進行

### 将来の目標
- [ ] 「攻撃 vs PP生成」システムの実装
- [ ] 五行相剋の戦略的効果
- [ ] 1ゲーム10分程度の適切なペース
- [ ] 複数回プレイしたくなる戦略性

このビジョンを実現することで、従来のカードゲームにない独自性を持った戦略ゲームを創造します。