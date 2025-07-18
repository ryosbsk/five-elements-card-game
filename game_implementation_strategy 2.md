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

## 🔧 実装詳細仕様（確定版）

### 1️⃣ 手札管理システム

```javascript
// 手札上限処理（シンプル実装優先）
function drawCard(count) {
  for (let i = 0; i < count; i++) {
    if (hand.length < maxHandSize && deck.length > 0) {
      hand.push(deck.pop());
    }
    // 手札上限時またはデッキ切れ時：ドローしない
  }
}

const handSystem = {
  maxHandSize: 7,
  initialHand: 3,
  // ターン開始時：手札上限でなければ1枚ドロー
};
```

### 2️⃣ デッキ切れ処理

```javascript
// デッキ切れ = 敗北条件
function checkGameOver() {
  // ドローフェーズでドローできない = 敗北
  if (deck.length === 0 && hand.length < maxHandSize) {
    return "defeat"; // デッキ切れ敗北
  }
  
  if (defeatedCostTotal >= 5) {
    return "victory"; // 撃破勝利
  }
  
  return "continue";
}
```

### 3️⃣ 配置システム（自動化）

```javascript
// 左から自動配置
function placeCard(card) {
  for (let i = 0; i < 3; i++) {
    if (battleField.player[i] === null) {
      battleField.player[i] = card;
      playerPP -= card.cost;
      removeFromHand(card);
      return true;
    }
  }
  return false; // 配置失敗
}

// 撃破後も同様に左から自動配置
// 空きスロットがあれば自動で左端に配置
```

### 4️⃣ 攻撃対象選択UI

```javascript
// プレイヤー攻撃時のUI
function initiateAttack(attackerCard) {
  // 敵カード群をハイライト表示
  enemyCards.forEach(card => {
    card.classList.add('selectable-target');
    card.onclick = () => executeAttack(attackerCard, card);
  });
  
  showMessage("攻撃対象を選択してください");
}

// クリック・タップで直感的な操作
```

### 5️⃣ Phase 1戦略要素（最小限）

```javascript
// 実装する戦略要素
1. PP管理：いつ高コストカードを出すか
2. 攻撃対象選択：どの敵を優先除去するか  
3. カード配置タイミング：手札とPPの管理

// 実装しない戦略要素（将来用）
1. 配置位置選択
2. 複雑な行動選択
3. 高度なコンボシステム

// 目標：シンプルだが基本的な戦略性は保持
```

### 6️⃣ スピードシステム（Phase 1版）

```javascript
// 行動順序決定のみ
function determineTurnOrder() {
  const allCards = [...playerCards, ...enemyCards];
  return allCards.sort((a, b) => b.speed - a.speed);
}

// Phase 2以降でスピード価値向上：
// - 行動間隔システム
// - PP生成頻度への影響
// - より複雑な戦術的価値
```

### 7️⃣ エラーハンドリング

```javascript
// 基本安全装置
function canPlaceCard(card) {
  return playerPP >= card.cost && 
         hasEmptySlot() && 
         hand.includes(card);
}

function canAttack(attacker, target) {
  return attacker.hp > 0 && 
         target.hp > 0 && 
         !attacker.hasActed &&
         attacker.side !== target.side;
}

function validateGameState() {
  // HP負値チェック、不正状態の修正など
  // 基本的な整合性確保
}
```

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

---

## 🚀 Phase 2: 革新システム実装（将来）

### 「攻撃 vs PP生成」選択システム追加

```javascript
// 戦闘フェーズの拡張
=== 戦闘フェーズ（Phase 2版） ===
5. 全カードをスピード順でソート
6. 順番に行動選択：
   - 「攻撃」：従来通りダメージ
   - 「PP生成」：+1PP、手札+1枚（上限チェック）
7. 分割クリックUI実装

// 手札管理への影響
PP生成選択時も手札上限チェック適用
```

### 敵AI行動選択追加

```javascript
function enemyActionAI(card) {
  // PP不足時はPP生成を重視
  if (enemyPP < 2 && Math.random() < 0.5) {
    return "generatePP";
  }
  
  // 手札が少ない時もPP生成重視
  if (enemyHand.length <= 2 && Math.random() < 0.3) {
    return "generatePP"; 
  }
  
  // 基本は攻撃
  return "attack";
}
```

### スピード価値の向上

```javascript
// Phase 2でスピードの重要性激増
高スピードカード：
- 頻繁にPP生成 → リソース優位
- 手札補充回数増 → 選択肢拡大

低スピードカード：  
- 一撃必殺重視 → 高攻撃力活用
- タイミング重要 → 戦術的価値
```

---

## 📋 実装優先度・完成基準

### 🎯 Phase 1最小成功条件

1. **基本ゲーム成立**
   - 3vs3戦闘が動作
   - PP管理システム機能
   - 勝利・敗北条件達成

2. **操作性確保**
   - カード配置（左から自動）
   - 攻撃対象選択（クリック）
   - 直感的で分かりやすいUI

3. **敵AI動作**
   - 基本的な召喚・攻撃判断
   - ゲーム進行の阻害なし

### 🌟 Phase 1理想形

- 上記 + 美しいUI
- 上記 + スムーズな操作感
- 上記 + 基本的戦略性の実感

### ⚡ Phase 2目標

- りょうちゃんの革新システム完全実装
- スピードパラメータ価値の最大化
- 戦略性の飛躍的向上

---

## 💝 開発方針の確認

### 実装哲学
1. **完成最優先**：動作するゲームを確実に作る
2. **段階的拡張**：基盤完成後に革新機能追加  
3. **シンプル実装**：複雑性より確実性を重視
4. **将来性保持**：革新アイデアは必ず実現

### 技術判断基準
- **実装簡単** > 機能豊富
- **動作確実** > 見た目美麗
- **戦略シンプル** > 戦略複雑

**りょうちゃんの「完成させることが一番の目的」を最優先にした、現実的で確実な開発戦略です。**