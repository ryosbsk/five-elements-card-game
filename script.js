// 五行カードバトルゲーム

// カードデータ
const cardData = [
    // コスト1カード
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

// ゲーム状態
let gameState = {
    phase: 'draw',
    turn: 1,
    playerPP: 1,
    maxPP: 1,
    enemyPP: 1,
    enemyMaxPP: 1,
    playerHand: [],
    playerDeck: [],
    enemyHand: [],
    enemyDeck: [],
    playerField: [null, null, null],
    enemyField: [null, null, null],
    defeatedCost: 0,
    enemyDefeatedCost: 0,
    attackMode: false,
    currentAttacker: null,
    justStartedAttack: false,
    battleQueue: [],
    turnOrder: []
};

// DOM要素
const elements = {
    phase: document.getElementById('current-phase'),
    turn: document.getElementById('turn-counter'),
    pp: document.getElementById('pp-counter'),
    victory: document.getElementById('victory-counter'),
    enemyHandCount: document.getElementById('enemy-hand-count'),
    enemyPP: document.getElementById('enemy-pp'),
    message: document.getElementById('game-message'),
    playerHand: document.getElementById('player-hand'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    skipActionBtn: document.getElementById('skip-action-btn'),
    restartBtn: document.getElementById('restart-btn'),
    gameBackground: document.getElementById('game-background')
};

// ユーティリティ関数
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function createCard(cardData, isPlayer = true) {
    const card = {
        ...cardData,
        id: Math.random().toString(36).substr(2, 9),
        maxHp: cardData.hp,
        isPlayer: isPlayer
    };
    return card;
}

function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${card.element}`;
    cardElement.dataset.cardId = card.id;
    
    cardElement.innerHTML = `
        <div class="card-header">
            <span class="card-name">${card.name}</span>
            <span class="card-cost">${card.cost}</span>
        </div>
        <div class="card-stats">
            <div class="stat hp">❤️${card.hp}</div>
            <div class="stat attack">⚔️${card.attack}</div>
            <div class="stat speed">⚡${card.speed}</div>
        </div>
    `;
    
    return cardElement;
}

function updateDisplay() {
    // フェーズ表示の改善
    const phaseNames = {
        'draw': 'ドローフェーズ',
        'summon': '召喚フェーズ',
        'battle': '戦闘フェーズ',
        'end': '終了フェーズ',
        'gameover': 'ゲーム終了'
    };
    
    
    if (elements.phase) elements.phase.textContent = phaseNames[gameState.phase] || gameState.phase;
    if (elements.turn) elements.turn.textContent = `ターン: ${gameState.turn}`;
    if (elements.pp) elements.pp.textContent = `PP: ${gameState.playerPP}/${gameState.maxPP}`;
    if (elements.victory) elements.victory.textContent = `撃破: ${gameState.defeatedCost}/5`;
    if (elements.enemyHandCount) elements.enemyHandCount.textContent = `敵手札: ${gameState.enemyHand.length}枚`;
    if (elements.enemyPP) elements.enemyPP.textContent = `敵PP: ${gameState.enemyPP}/${gameState.enemyMaxPP}`;
    
    updateHandDisplay();
    updateFieldDisplay();
    
    // ボタンの状態管理
    if (gameState.phase === 'summon') {
        elements.endTurnBtn.textContent = '戦闘フェーズへ';
        elements.endTurnBtn.disabled = false;
        elements.endTurnBtn.style.display = 'inline-block';
        elements.skipActionBtn.style.display = 'none';
    } else if (gameState.phase === 'battle') {
        // 戦闘フェーズ中は行動スキップボタンのみ表示
        const currentTurnCard = gameState.turnOrder.find(card => !card.hasActed);
        if (currentTurnCard && currentTurnCard.isPlayer) {
            elements.skipActionBtn.style.display = 'inline-block';
            elements.skipActionBtn.disabled = false;
        } else {
            elements.skipActionBtn.style.display = 'none';
        }
        elements.endTurnBtn.style.display = 'none';
    } else {
        elements.endTurnBtn.disabled = true;
        elements.endTurnBtn.style.display = 'inline-block';
        elements.skipActionBtn.style.display = 'none';
    }
}

function updateHandDisplay() {
    const playerHandElement = document.getElementById('player-hand');
    if (!playerHandElement) {
        console.error('player-hand element not found');
        return;
    }
    
    playerHandElement.innerHTML = '';
    gameState.playerHand.forEach(card => {
        const cardElement = createCardElement(card);
        
        // カードクリックイベント
        cardElement.addEventListener('click', () => {
            if (gameState.phase === 'summon' && canPlayCard(card)) {
                playCard(card);
            }
        });
        
        // PP不足の場合は暗くする
        if (card.cost > gameState.playerPP) {
            cardElement.style.opacity = '0.5';
        }
        
        playerHandElement.appendChild(cardElement);
    });
}

function updateFieldDisplay() {
    // プレイヤーフィールド
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`player-slot-${i}`);
        if (gameState.playerField[i]) {
            const cardElement = createCardElement(gameState.playerField[i]);
            
            // 戦闘フェーズでの攻撃クリック
            if (gameState.phase === 'battle' && !gameState.playerField[i].hasActed) {
                // 現在の行動順序をチェック
                const currentTurnCard = gameState.turnOrder.find(card => !card.hasActed);
                if (currentTurnCard && currentTurnCard.id === gameState.playerField[i].id) {
                    cardElement.addEventListener('click', (event) => {
                        console.log('Player card clicked:', gameState.playerField[i].name);
                        event.stopPropagation(); // 親要素への伝播を防止
                        if (!gameState.attackMode) {
                            console.log('Starting attack...');
                            startAttack(gameState.playerField[i]);
                        } else {
                            console.log('Attack mode already active');
                        }
                    });
                    cardElement.classList.add('selectable');
                    cardElement.classList.add('current-turn');
                }
            }
            
            slot.innerHTML = '';
            slot.appendChild(cardElement);
        } else {
            slot.innerHTML = '<div class="empty-slot">空</div>';
        }
    }
    
    // 敵フィールド
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`enemy-slot-${i}`);
        if (gameState.enemyField[i]) {
            const cardElement = createCardElement(gameState.enemyField[i]);
            
            // 攻撃対象として選択可能
            if (gameState.attackMode) {
                cardElement.classList.add('selectable-target');
                cardElement.addEventListener('click', (event) => {
                    console.log('Enemy card clicked:', gameState.enemyField[i].name);
                    event.stopPropagation(); // 親要素への伝播を防止
                    event.preventDefault(); // デフォルトイベントを防止
                    executeAttack(gameState.currentAttacker, gameState.enemyField[i]);
                });
            }
            
            slot.innerHTML = '';
            slot.appendChild(cardElement);
        } else {
            slot.innerHTML = '<div class="empty-slot">空</div>';
        }
    }
}

function showMessage(message) {
    elements.message.textContent = message;
}

function canPlayCard(card) {
    return gameState.playerPP >= card.cost && hasEmptySlot(gameState.playerField);
}

function hasEmptySlot(field) {
    return field.some(slot => slot === null);
}

function playCard(card) {
    // 空きスロットに配置
    const emptyIndex = gameState.playerField.findIndex(slot => slot === null);
    if (emptyIndex !== -1) {
        gameState.playerField[emptyIndex] = card;
        gameState.playerPP -= card.cost;
        gameState.playerHand = gameState.playerHand.filter(c => c.id !== card.id);
        
        showMessage(`${card.name}を召喚しました！`);
        updateDisplay();
    }
}

function startAttack(attacker) {
    console.log('startAttack called for:', attacker.name);
    gameState.attackMode = true;
    gameState.currentAttacker = attacker;
    gameState.justStartedAttack = true;
    
    // 攻撃対象を選択できるようにする
    showMessage(`${attacker.name}の攻撃対象を選択してください（敵カード以外をクリックでキャンセル）`);
    
    // 少し遅延してからキャンセルリスナーを設定
    setTimeout(() => {
        console.log('Setting up cancel listener...');
        gameState.justStartedAttack = false;
        document.addEventListener('click', handleAttackCancelClick);
    }, 100);
    
    updateDisplay();
}

function handleAttackCancelClick(event) {
    console.log('handleAttackCancelClick called, target:', event.target);
    
    // 攻撃モードでない場合は何もしない
    if (!gameState.attackMode) {
        console.log('Not in attack mode, ignoring');
        return;
    }
    
    // 攻撃開始直後の場合はキャンセルしない
    if (gameState.justStartedAttack) {
        console.log('Just started attack, ignoring');
        return;
    }
    
    // クリックされた要素が敵カード（selectable-target）かチェック
    const clickedElement = event.target;
    const isEnemyCard = clickedElement.closest('.selectable-target');
    
    console.log('Clicked element:', clickedElement);
    console.log('Is enemy card:', isEnemyCard);
    
    // 敵カードでない場合はキャンセル
    if (!isEnemyCard) {
        console.log('Not an enemy card, canceling attack');
        cancelAttack();
    }
}

function cancelAttack() {
    gameState.attackMode = false;
    gameState.currentAttacker = null;
    gameState.justStartedAttack = false;
    
    // 全体クリックイベントを削除
    document.removeEventListener('click', handleAttackCancelClick);
    
    showMessage('攻撃をキャンセルしました');
    updateDisplay();
}

function executeAttack(attacker, target) {
    console.log('executeAttack called:', attacker.name, 'attacking', target.name);
    
    if (gameState.attackMode) {
        const damage = Math.max(1, attacker.attack);
        target.hp -= damage;
        attacker.hasActed = true;
        
        showMessage(`${attacker.name}が${target.name}に${damage}ダメージ！`);
        
        // HPが0以下になったらカードを撃破
        if (target.hp <= 0) {
            defeatCard(target);
        }
        
        // 攻撃モードをキャンセル（メッセージは表示しない）
        gameState.attackMode = false;
        gameState.currentAttacker = null;
        
        // 全体クリックイベントを削除
        document.removeEventListener('click', handleAttackCancelClick);
        
        updateDisplay();
        updateTurnOrderDisplay();
        
        // 戦闘継続チェック
        setTimeout(() => {
            if (checkBattleEnd()) {
                nextPhase();
            } else {
                // 次の行動者がAIの場合、自動で行動
                const nextCard = gameState.turnOrder.find(card => !card.hasActed);
                if (nextCard && !nextCard.isPlayer) {
                    enemyAutoAttack(nextCard);
                }
            }
        }, 1000);
    } else {
        console.log('Not in attack mode, ignoring executeAttack');
    }
}

function enemyAutoAttack(enemyCard) {
    const playerCards = gameState.playerField.filter(c => c !== null);
    
    if (playerCards.length > 0) {
        let target;
        // 90%の確率で最もHPが低いカードを狙う
        if (Math.random() < 0.9) {
            target = playerCards.reduce((lowest, card) => 
                card.hp < lowest.hp ? card : lowest
            );
        } else {
            target = playerCards[Math.floor(Math.random() * playerCards.length)];
        }
        
        const damage = Math.max(1, enemyCard.attack);
        target.hp -= damage;
        enemyCard.hasActed = true;
        
        showMessage(`敵の${enemyCard.name}が${target.name}に${damage}ダメージ！`);
        
        // HPが0以下になったらカードを撃破
        if (target.hp <= 0) {
            defeatCard(target);
        }
        
        updateDisplay();
        updateTurnOrderDisplay();
        
        // 戦闘継続チェック
        setTimeout(() => {
            if (checkBattleEnd()) {
                nextPhase();
            } else {
                // 次の行動者がいれば続行
                const nextCard = gameState.turnOrder.find(card => !card.hasActed);
                if (nextCard && !nextCard.isPlayer) {
                    enemyAutoAttack(nextCard);
                }
            }
        }, 1500);
    }
}

function defeatCard(card) {
    if (card.isPlayer) {
        const index = gameState.playerField.findIndex(c => c && c.id === card.id);
        if (index !== -1) {
            gameState.playerField[index] = null;
            gameState.enemyDefeatedCost += card.cost;
        }
    } else {
        const index = gameState.enemyField.findIndex(c => c && c.id === card.id);
        if (index !== -1) {
            gameState.enemyField[index] = null;
            gameState.defeatedCost += card.cost;
        }
    }
    
    showMessage(`${card.name}が撃破されました！`);
    
    // 行動順からも削除
    gameState.turnOrder = gameState.turnOrder.filter(c => c.id !== card.id);
    updateTurnOrderDisplay();
}

function checkBattleEnd() {
    // 全てのカードが行動済みかチェック
    const allActed = gameState.turnOrder.every(card => card.hasActed);
    
    if (allActed) {
        showMessage('全員の行動が完了しました。ターン終了します。');
    }
    
    return allActed;
}

function updateTurnOrderDisplay() {
    // 行動順UI更新関数
    // FF10風の行動順表示
    const turnOrderElement = document.getElementById('turn-order');
    if (turnOrderElement) {
        turnOrderElement.innerHTML = '';
        const unactedCards = gameState.turnOrder.filter(card => !card.hasActed);
        unactedCards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = `turn-order-card ${card.element} ${card.isPlayer ? 'player' : 'enemy'}`;
            cardElement.innerHTML = `
                <span class="card-name">${card.name}</span>
                <span class="card-speed">⚡${card.speed}</span>
                <span class="card-owner">${card.isPlayer ? 'プレイヤー' : '敵'}</span>
            `;
            if (index === 0) {
                cardElement.classList.add('current-turn');
            }
            turnOrderElement.appendChild(cardElement);
        });
    }
}

function nextPhase() {
    switch (gameState.phase) {
        case 'draw':
            gameState.phase = 'summon';
            showMessage('召喚フェーズ：カードを配置してください');
            break;
        case 'summon':
            // 召喚フェーズ完了後、敵AI召喚
            enemyAISummon();
            gameState.phase = 'battle';
            prepareBattle();
            break;
        case 'battle':
            gameState.phase = 'end';
            endTurn();
            break;
    }
    updateDisplay();
}

function prepareBattle() {
    // 戦闘準備：全カードをスピード順でソート
    const allCards = [
        ...gameState.playerField.filter(c => c !== null),
        ...gameState.enemyField.filter(c => c !== null)
    ];
    
    gameState.turnOrder = allCards.sort((a, b) => b.speed - a.speed);
    
    // 行動フラグをリセット
    gameState.turnOrder.forEach(card => {
        card.hasActed = false;
    });
    
    showMessage('戦闘フェーズ：カードをクリックして攻撃してください');
    updateTurnOrderDisplay();
    
    // 最初の行動者が敵の場合、自動で攻撃開始
    const firstCard = gameState.turnOrder.find(card => !card.hasActed);
    if (firstCard && !firstCard.isPlayer) {
        setTimeout(() => {
            enemyAutoAttack(firstCard);
        }, 1000);
    }
}

function endTurn() {
    // 勝敗判定
    if (checkWinCondition()) {
        return;
    }
    
    // 次のターンの準備
    gameState.turn++;
    
    // PP増加（両者）
    gameState.maxPP = Math.min(gameState.maxPP + 1, 5);
    gameState.playerPP = gameState.maxPP;
    gameState.enemyMaxPP = Math.min(gameState.enemyMaxPP + 1, 5);
    gameState.enemyPP = gameState.enemyMaxPP;
    
    // ドロー（両者）
    if (gameState.playerDeck.length > 0 && gameState.playerHand.length < 7) {
        gameState.playerHand.push(gameState.playerDeck.pop());
    }
    if (gameState.enemyDeck.length > 0 && gameState.enemyHand.length < 7) {
        gameState.enemyHand.push(gameState.enemyDeck.pop());
    }
    
    gameState.phase = 'summon';
    showMessage('新しいターン開始！カードを配置してください');
    updateDisplay();
}

function enemyAISummon() {
    if (gameState.enemyHand.length > 0) {
        // コストが高い順にソート
        const sortedCards = gameState.enemyHand.sort((a, b) => b.cost - a.cost);
        const summonedCards = [];
        
        // PPが続く限り、コストの高いカードから順番に召喚
        for (const card of sortedCards) {
            if (gameState.enemyPP >= card.cost && hasEmptySlot(gameState.enemyField)) {
                const emptyIndex = gameState.enemyField.findIndex(slot => slot === null);
                gameState.enemyField[emptyIndex] = card;
                gameState.enemyPP -= card.cost;
                gameState.enemyHand = gameState.enemyHand.filter(c => c.id !== card.id);
                summonedCards.push(card.name);
            }
        }
        
        if (summonedCards.length > 0) {
            showMessage(`敵が${summonedCards.join('、')}を召喚！`);
            updateDisplay();
        }
    }
}

function checkWinCondition() {
    // プレイヤーの勝利条件：敵カード5コスト撃破
    if (gameState.defeatedCost >= 5) {
        setTimeout(() => {
            showMessage('🎉 勝利！おめでとうございます！🎉');
            gameState.phase = 'gameover';
            elements.endTurnBtn.disabled = true;
        }, 1000);
        return true;
    }
    
    // 敵の勝利条件：プレイヤーカード5コスト撃破
    if (gameState.enemyDefeatedCost >= 5) {
        setTimeout(() => {
            showMessage('💀 敗北！敵に5コスト分撃破されました...');
            gameState.phase = 'gameover';
            elements.endTurnBtn.disabled = true;
        }, 1000);
        return true;
    }
    
    // 場が空になった場合の敗北
    const playerCards = gameState.playerField.filter(c => c !== null);
    const enemyCards = gameState.enemyField.filter(c => c !== null);
    
    if (playerCards.length === 0 && gameState.playerHand.length === 0) {
        setTimeout(() => {
            showMessage('💀 敗北！すべてのカードが撃破されました...');
            gameState.phase = 'gameover';
            elements.endTurnBtn.disabled = true;
        }, 1000);
        return true;
    }
    
    if (enemyCards.length === 0 && gameState.enemyHand.length === 0) {
        setTimeout(() => {
            showMessage('🎉 勝利！敵のカードをすべて撃破しました！🎉');
            gameState.phase = 'gameover';
            elements.endTurnBtn.disabled = true;
        }, 1000);
        return true;
    }
    
    return false;
}

function initializeGame() {
    // デッキ作成
    gameState.playerDeck = shuffleArray(cardData.map(card => createCard(card, true)));
    gameState.enemyDeck = shuffleArray(cardData.map(card => createCard(card, false)));
    
    // 初期手札
    gameState.playerHand = [];
    gameState.enemyHand = [];
    
    for (let i = 0; i < 3; i++) {
        if (gameState.playerDeck.length > 0) {
            gameState.playerHand.push(gameState.playerDeck.pop());
        }
        if (gameState.enemyDeck.length > 0) {
            gameState.enemyHand.push(gameState.enemyDeck.pop());
        }
    }
    
    
    gameState.phase = 'summon';
    showMessage('ゲーム開始！手札からカードを選んでクリックしてください');
    updateDisplay();
}

// イベントリスナー
elements.endTurnBtn.addEventListener('click', () => {
    if (gameState.phase === 'summon') {
        nextPhase();
    } else if (gameState.phase === 'battle') {
        nextPhase();
    }
});

elements.skipActionBtn.addEventListener('click', () => {
    if (gameState.phase === 'battle') {
        // 現在の行動者をスキップ
        const currentTurnCard = gameState.turnOrder.find(card => !card.hasActed);
        if (currentTurnCard && currentTurnCard.isPlayer) {
            currentTurnCard.hasActed = true;
            showMessage(`${currentTurnCard.name}の行動をスキップしました`);
            updateDisplay();
            updateTurnOrderDisplay();
            
            // 次の行動者へ
            setTimeout(() => {
                if (checkBattleEnd()) {
                    nextPhase();
                } else {
                    // 次の行動者がAIの場合、自動で行動
                    const nextCard = gameState.turnOrder.find(card => !card.hasActed);
                    if (nextCard && !nextCard.isPlayer) {
                        enemyAutoAttack(nextCard);
                    }
                }
            }, 1000);
        }
    }
});

elements.restartBtn.addEventListener('click', () => {
    // ゲーム状態をリセット
    gameState = {
        phase: 'draw',
        turn: 1,
        playerPP: 1,
        maxPP: 1,
        enemyPP: 1,
        enemyMaxPP: 1,
        playerHand: [],
        playerDeck: [],
        enemyHand: [],
        enemyDeck: [],
        playerField: [null, null, null],
        enemyField: [null, null, null],
        defeatedCost: 0,
        enemyDefeatedCost: 0,
        attackMode: false,
        currentAttacker: null,
        battleQueue: [],
        turnOrder: []
    };
    
    // ボタンの初期化
    elements.endTurnBtn.style.display = 'inline-block';
    elements.skipActionBtn.style.display = 'none';
    
    // ゲーム再開
    initializeGame();
});

// ゲーム開始
initializeGame();