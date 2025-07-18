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

## 🔧 実装詳細仕様（Phase 1特化）

### 1️⃣ 手札・デッキ管理システム

```javascript
// 手札上限処理（シンプル実装）
function drawCard(count) {
  for (let i = 0; i < count; i++) {
    if (hand.length < maxHandSize && deck.length > 0) {
      hand.push(deck.pop());
    }
    // 手札上限時：ドローしない（敗北条件に当たらない）
  }
}

// デッキ切れ敗北条件（修正版）
function checkDeckDefeat() {
  // ドロー必要時にデッキが空 = 敗北
  if (deck.length === 0 && shouldDraw()) {
    return true;
  }
  return false;
}

function shouldDraw() {
  // ターン開始時のドロー判定
  return hand.length < maxHandSize;
}

const handSystem = {
  maxHandSize: 7,
  initialHand: 3,
  // ターン開始時：手札に余裕があればドロー、なければスキップ
};
```

### 2️⃣ 攻撃対象選択・キャンセル

```javascript
// 攻撃開始
function initiateAttack(attackerCard) {
  gameState.attackMode = true;
  gameState.currentAttacker = attackerCard;
  
  // 敵カード群をハイライト
  enemyCards.forEach(card => {
    card.classList.add('selectable-target');
    card.onclick = () => executeAttack(attackerCard, card);
  });
  
  // キャンセル用：背景クリックで攻撃キャンセル
  document.getElementById('game-background').onclick = cancelAttack;
  document.getElementById('ui-area').onclick = cancelAttack;
  
  showMessage("攻撃対象を選択してください（他の場所をクリックでキャンセル）");
}

// 攻撃キャンセル
function cancelAttack() {
  gameState.attackMode = false;
  gameState.currentAttacker = null;
  
  // ハイライト解除
  enemyCards.forEach(card => {
    card.classList.remove('selectable-target');
    card.onclick = null;
  });
  
  // キャンセル用イベント削除
  document.getElementById('game-background').onclick = null;
  document.getElementById('ui-area').onclick = null;
  
  showMessage("攻撃をキャンセルしました");
}
```

### 3️⃣ ターン管理・行動フラグ

```javascript
// ターン終了時処理
function endTurn() {
  // 全カードの行動フラグリセット
  [...playerCards, ...enemyCards].forEach(card => {
    card.hasActed = false;
  });
  
  // 攻撃モードキャンセル
  if (gameState.attackMode) {
    cancelAttack();
  }
  
  // 次ターンへ
  startNextTurn();
}

// フェーズ管理
const gamePhases = {
  DRAW: "ドローフェーズ",
  SUMMON: "召喚フェーズ", 
  BATTLE: "戦闘フェーズ",
  END: "終了フェーズ"
};

let currentPhase = gamePhases.DRAW;
```

### 4️⃣ 敵AI配置・攻撃

```javascript
// 敵AI配置（プレイヤーと同じ左から自動）
function enemySummonAI() {
  const availableCards = getEnemyHand();
  const affordableCards = availableCards.filter(card => card.cost <= enemyPP);
  
  if (affordableCards.length > 0 && hasEmptySlot('enemy')) {
    // コストが高いカードを優先
    const cardToSummon = affordableCards.sort((a, b) => b.cost - a.cost)[0];
    placeCardAuto(cardToSummon, 'enemy'); // 左から自動配置
  }
}

// 敵AI攻撃対象（HPターゲティング）
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

### 5️⃣ UI・表示システム

```javascript
// 手札ソート（属性順・コスト順）
function sortHand(hand) {
  const elementOrder = { '木': 0, '火': 1, '土': 2, '金': 3, '水': 4 };
  
  return hand.sort((a, b) => {
    // 属性順が優先
    if (elementOrder[a.element] !== elementOrder[b.element]) {
      return elementOrder[a.element] - elementOrder[b.element];
    }
    // 同属性内ではコスト順
    return a.cost - b.cost;
  });
}

// カードステータス表示
function createCardDisplay(card) {
  return `
    <div class="card ${card.element}">
      <div class="card-header">
        <span class="card-name">${card.name}</span>
        <span class="card-cost">${card.cost}</span>
      </div>
      <div class="card-stats">
        <div class="stat hp">❤️${card.hp}</div>
        <div class="stat attack">⚔️${card.attack}</div>
        <div class="stat speed">⚡${card.speed}</div>
      </div>
    </div>
  `;
}

// フェーズ表示
function updatePhaseDisplay() {
  document.getElementById('phase-indicator').innerHTML = `
    <div class="phase-display">
      現在：${currentPhase}
    </div>
  `;
}
```

### 6️⃣ エラーハンドリング

```javascript
// 基本安全装置
function canPlaceCard(card) {
  return playerPP >= card.cost && 
         hasEmptySlot('player') && 
         hand.includes(card);
}

function canAttack(attacker, target) {
  return attacker.hp > 0 && 
         target.hp > 0 && 
         !attacker.hasActed &&
         attacker.side !== target.side;
}

function validateGameState() {
  // HP負値の修正
  [...playerCards, ...enemyCards].forEach(card => {
    if (card.hp < 0) card.hp = 0;
  });
}
```

---

## 🎮 Phase 1ゲームフロー（最終確定版）

```javascript
=== ターン開始 ===
1. currentPhase = DRAW
2. PP+1（上限5まで）
3. 手札に余裕があればドロー、なければスキップ

=== 召喚フェーズ ===
4. currentPhase = SUMMON  
5. プレイヤー：カード配置（PP消費、左から自動配置）
6. 敵：AI配置（同様に左から自動）

=== 戦闘フェーズ ===
7. currentPhase = BATTLE
8. 全カードをスピード順でソート
9. 順番に攻撃実行（対象クリック選択、キャンセル可能）
10. HPが0になったカードは撃破

=== 終了フェーズ ===
11. currentPhase = END
12. 勝利条件チェック（5コスト撃破 or デッキ切れ）
13. hasActedフラグリセット
14. 次ターンまたはゲーム終了
```

---

## 💝 UI/UX設計案

### 🎨 カード表示アイデア

```css
/* カードレイアウト案 */
.card {
  width: 120px;
  height: 160px;
  border-radius: 8px;
  border: 2px solid;
}

.card.木 { border-color: #4CAF50; background: linear-gradient(to bottom, #E8F5E8, #C8E6C9); }
.card.火 { border-color: #F44336; background: linear-gradient(to bottom, #FFEBEE, #FFCDD2); }
.card.土 { border-color: #8D6E63; background: linear-gradient(to bottom, #EFEBE9, #D7CCC8); }
.card.金 { border-color: #FFC107; background: linear-gradient(to bottom, #FFFDE7, #FFF9C4); }
.card.水 { border-color: #2196F3; background: linear-gradient(to bottom, #E3F2FD, #BBDEFB); }

.card-stats {
  display: flex;
  justify-content: space-around;
  font-size: 14px;
  font-weight: bold;
}
```

### 🖥️ ゲーム画面レイアウト

```
┌─────フェーズ表示─────┐
│ 現在：召喚フェーズ     │
│ PP: 3/5              │
└─────────────────────┘

┌─────────敵エリア─────────┐
│ [敵1]  [敵2]  [敵3]    │
│ ❤️25   ❤️40   [空]     │
│ ⚔️35   ⚔️15            │  
└─────────────────────────┘

┌────────味方エリア────────┐
│ [味1]  [味2]  [味3]    │
│ ❤️30   ❤️15   [空]     │
│ ⚔️25   ⚔️15            │
└─────────────────────────┘

┌─────────手札─────────┐
│ [木1] [火1] [土2] [水1] │
│ コスト順・属性順ソート   │
└─────────────────────────┘
```

---

## 📋 実装優先度（Phase 1のみ）

### 🎯 最小成功条件

1. **基本ゲーム成立**：3vs3戦闘、PP管理、勝利・敗北
2. **操作性確保**：カード配置、攻撃選択、キャンセル機能
3. **AI動作**：基本的な召喚・攻撃判断

### 🌟 理想的完成形

- 上記 + 美しいUI（属性別色分け）
- 上記 + スムーズな操作感（フェーズ表示）
- 上記 + 分かりやすい情報表示

**Phase 1に特化した、確実で完成度の高い実装戦略です。**

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

## 💝 攻撃キャンセルUI案

### 🎮 一般的デジタルカードゲーム風

```javascript
// キャンセル方法の複数選択肢
1. 背景クリック：ゲーム背景の何もないところ
2. UIエリアクリック：手札エリア、PP表示エリア
3. ESCキー：キーボード対応
4. 専用キャンセルボタン：明示的なキャンセル

// 実装優先度
1位：背景クリック（直感的、モバイル対応）
2位：UIエリアクリック（追加の安全装置）
3位：専用ボタン（分かりやすさ重視）
```

### 🖱️ 操作フロー例

```
プレイヤーカードクリック
　↓
敵カード群ハイライト + "攻撃対象を選択"メッセージ
　↓
【A】敵カードクリック → 攻撃実行
【B】背景/UIクリック → キャンセル、元の状態に戻る
```

---

## 🎨 ステータス表示アイデア

### 💝 カード表示案1：アイコン + 数値

```html
<div class="card-stats">
  <span class="hp">❤️25</span>
  <span class="attack">⚔️35</span>  
  <span class="speed">⚡10</span>
</div>
```

### 🌟 カード表示案2：縦並びレイアウト

```html
<div class="card-stats-vertical">
  <div class="stat-row">
    <span class="icon">❤️</span>
    <span class="value">25</span>
  </div>
  <div class="stat-row">
    <span class="icon">⚔️</span>
    <span class="value">35</span>
  </div>
  <div class="stat-row">
    <span class="icon">⚡</span>
    <span class="value">10</span>
  </div>
</div>
```

### 🎯 カード表示案3：バー表示

```html
<!-- HP残量をビジュアル化 -->
<div class="hp-bar">
  <div class="hp-current" style="width: 60%"></div>
  <span class="hp-text">15/25</span>
</div>
```

---

## 📱 フェーズ表示システム

### 💝 表示案1：シンプルテキスト

```html
<div class="phase-indicator">
  <span class="current-phase">召喚フェーズ</span>
  <span class="turn-info">ターン3</span>
</div>
```

### 🌈 表示案2：進行バー風

```html
<div class="phase-progress">
  <div class="phase-step active">ドロー</div>
  <div class="phase-step active">召喚</div>
  <div class="phase-step current">戦闘</div>
  <div class="phase-step">終了</div>
</div>
```

### ⚡ 表示案3：色分けアイコン

```html
<div class="phase-display-icons">
  <span class="phase-icon">📥</span> <!-- ドロー -->
  <span class="phase-icon active">🃏</span> <!-- 召喚 -->
  <span class="phase-icon">⚔️</span> <!-- 戦闘 -->
  <span class="phase-icon">🏁</span> <!-- 終了 -->
</div>
```

---

## 📋 実装優先度（Phase 1完成重視）

### 🎯 最小成功条件

1. **基本ゲーム成立**：3vs3戦闘、PP管理、勝利・敗北
2. **操作性確保**：カード配置、攻撃選択、キャンセル機能  
3. **AI動作**：基本的な召喚・攻撃判断
4. **情報表示**：カードステータス、フェーズ表示

### 🌟 理想的完成形

- 上記 + 美しいUI（属性別色分け）
- 上記 + スムーズな操作感（キャンセル機能）
- 上記 + 分かりやすい情報表示（フェーズ進行）

**Phase 1完成に特化した、確実で使いやすい実装戦略です。**