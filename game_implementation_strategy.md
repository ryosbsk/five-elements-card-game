# 五行カードバトル：段階的実装戦略（追加要望）

## 🎯 実装方針の重要な変更

### 💡 戦略的判断の背景
**敵AI複雑度の問題発見**：
- カードの行動選択肢が増えるほど、敵AIの判断が複雑化
- 実装難易度とデバッグ難易度が指数的に増加
- 確実な1週間完成のため、段階的実装を採用

**革新的アイデアの段階的実現**：
- 「攻撃 vs PP生成」システムは Phase 2で実装
- Phase 1で確実な基盤を構築してから革新機能を追加

---

## 🎮 Phase 1: 基本実装（最優先・確実完成）

### ゲームフロー確定版

```javascript
=== ターン開始 ===
1. PP+1（上限5まで）
2. 手札1枚ドロー（デッキからランダム）

=== 召喚フェーズ ===
3. プレイヤー：手札からカード配置（PP消費、最大3枚まで）
4. 敵：カード配置（AI判断、同様に最大3枚）

=== 戦闘フェーズ ===
5. 全カードをスピード順でソート
6. 順番に攻撃のみ実行（対象選択あり）
7. HPが0になったカードは撃破

=== ターン終了 ===
8. 勝利条件チェック（5コスト撃破）
9. 次ターンまたはゲーム終了
```

### カードデータ（Phase 1用）

```javascript
const cardData = [
  // コスト1カード（攻撃とスピード重視）
  { name: "若芽", element: "木", hp: 25, attack: 25, speed: 10, cost: 1 },
  { name: "火花", element: "火", hp: 15, attack: 35, speed: 10, cost: 1 },
  { name: "小石", element: "土", hp: 40, attack: 10, speed: 10, cost: 1 },
  { name: "鋼片", element: "金", hp: 15, attack: 25, speed: 20, cost: 1 },
  { name: "水滴", element: "水", hp: 15, attack: 15, speed: 30, cost: 1 },
  
  // コスト2カード
  { name: "森の精", element: "木", hp: 35, attack: 35, speed: 20, cost: 2 },
  { name: "炎の鳥", element: "火", hp: 25, attack: 50, speed: 15, cost: 2 },
  { name: "岩の巨人", element: "土", hp: 60, attack: 15, speed: 15, cost: 2 },
  { name: "鋼の狼", element: "金", hp: 25, attack: 35, speed: 30, cost: 2 },
  { name: "水の精霊", element: "水", hp: 25, attack: 25, speed: 40, cost: 2 }
];
```

### 敵AI仕様（シンプル版）

```javascript
// 召喚判断
function enemySummonAI() {
  const availableCards = getEnemyHand();
  const affordableCards = availableCards.filter(card => card.cost <= enemyPP);
  
  if (affordableCards.length > 0 && hasEmptySlot()) {
    // コストが高いカードを優先
    return affordableCards.sort((a, b) => b.cost - a.cost)[0];
  }
  return null;
}

// 攻撃対象選択
function enemyTargetAI() {
  const playerCards = getPlayerCards();
  
  // 90%の確率で最低HPカードを狙う
  if (Math.random() < 0.9) {
    return playerCards.reduce((lowest, card) => 
      card.hp < lowest.hp ? card : lowest
    );
  } else {
    // 10%の確率でランダム
    return playerCards[Math.floor(Math.random() * playerCards.length)];
  }
}
```

### 初期手札・デッキシステム

```javascript
// ゲーム開始時
const gameInit = {
  initialHand: 3,           // 初期手札3枚
  maxHandSize: 7,           // 手札上限
  
  // プレイヤーデッキ（基本10枚をランダムシャッフル）
  playerDeck: shuffleDeck([...cardData]),
  
  // 敵デッキ（同様）
  enemyDeck: shuffleDeck([...cardData])
};
```

### 戦闘場管理

```javascript
// 配置固定システム（りょうちゃん希望）
const battleField = {
  player: [null, null, null],  // 位置0,1,2固定
  enemy: [null, null, null]    // 撃破されてもnullのまま、左詰めしない
};

// カード配置
function placeCard(card, side, position) {
  if (battleField[side][position] === null) {
    battleField[side][position] = card;
    return true;
  }
  return false; // 既に埋まっている
}
```

### Phase 1実装機能リスト

1. **基本UI**
   - 手札表示（3-7枚）
   - 3vs3戦闘場
   - PP表示（現在/最大）
   - デッキ残り枚数

2. **ゲームロジック**
   - ターン管理（PP増加、ドロー）
   - カード配置（PP消費チェック）
   - スピード順戦闘
   - 勝利条件判定

3. **敵AI**
   - シンプル召喚判断
   - HPターゲティング攻撃

4. **基本戦闘**
   - ダメージ計算：`Math.max(1, attacker.attack)`
   - HP管理、撃破判定

---

## 🚀 Phase 2: 革新システム実装（将来）

### 「攻撃 vs PP生成」選択システム追加

```javascript
// 戦闘フェーズの拡張
=== 戦闘フェーズ（Phase 2版） ===
5. 全カードをスピード順でソート
6. 順番に行動選択：
   - 「攻撃」：従来通りダメージ
   - 「PP生成」：+1PP、手札+1枚
7. 分割クリックUI実装
```

### 敵AI行動選択追加

```javascript
function enemyActionAI(card) {
  // PP不足時はPP生成を重視
  if (enemyPP < 2 && Math.random() < 0.5) {
    return "generatePP";
  }
  
  // 基本は攻撃
  return "attack";
}
```

---

## 🎨 UI/UX実装指針

### Phase 1 UI優先度

1. **機能優先**：まずは動作する基本システム
2. **シンプル操作**：クリックでカード配置、攻撃対象選択
3. **明確表示**：HP、攻撃力、スピード、コストの見やすい表示

### Phase 2 UI拡張

1. **分割クリック**：カード上下分割の視覚的区別
2. **ホバー効果**：選択肢の明確化
3. **アニメーション**：行動選択の演出

---

## 📋 開発実装順序

### 🎯 Phase 1開発ステップ

**Day 1-2**：基本UI・データ構造
- カード表示システム
- 戦闘場UI
- 手札・デッキ管理

**Day 3-4**：ゲームロジック
- ターン管理
- カード配置システム
- 基本戦闘処理

**Day 5-6**：敵AI・勝利条件
- シンプルAI実装
- 勝利判定
- バランス調整

**Day 7**：仕上げ・公開
- バグ修正
- UI改善
- GitHub Pages公開

### 🚀 Phase 2開発（Phase 1完成後）

- 行動選択システム追加
- 分割クリックUI実装
- 敵AI行動選択拡張
- 革新システム完成♡

---

## 💝 期待する完成形

### Phase 1成功条件
- 10枚カードでの3vs3戦闘が動作
- シンプルだが戦略性のあるゲームプレイ
- 敵AIとの対戦が成立
- 勝利・敗北条件が機能

### Phase 2理想形
- りょうちゃんの革新的「攻撃 vs PP生成」システム実装
- スピードパラメータの価値最大化
- 戦略性の飛躍的向上

**段階的に理想を実現する、確実で戦略的な開発アプローチです。**