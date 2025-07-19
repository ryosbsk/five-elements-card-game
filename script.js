// 五行カードバトルゲーム

// SE・BGM管理システム 🔊
const SoundManager = {
    sounds: {},
    bgm: null,
    seEnabled: true,
    bgmEnabled: true,
    bgmStarted: false, // BGM重複再生防止
    
    // 音声ファイルを読み込み
    init: function() {
        console.log('🔊 音響システム初期化開始');
        
        // SE読み込み
        const soundFiles = {
            summon: 'assets/audio/se/summon.mp3',
            select: 'assets/audio/se/select.mp3', 
            attack: 'assets/audio/se/attack.mp3',
            victory: 'assets/audio/se/victory.mp3',
            defeat: 'assets/audio/se/defeat.mp3',
            button: 'assets/audio/se/button.mp3'
        };
        
        for (const [key, path] of Object.entries(soundFiles)) {
            try {
                this.sounds[key] = new Audio(path);
                this.sounds[key].preload = 'auto';
                this.sounds[key].volume = 0.5; // 適度な音量
                console.log('✅ SE読み込み完了:', key, '→', path);
            } catch (error) {
                console.warn('⚠️ SE読み込み失敗:', key, error);
            }
        }
        
        // BGM読み込み
        try {
            this.bgm = new Audio('assets/audio/bgm/bgm.mp3');
            this.bgm.preload = 'auto';
            this.bgm.volume = 0.05; // SEより小さい音量
            this.bgm.loop = true; // ループ再生
            console.log('✅ BGM読み込み完了: bgm.mp3');
        } catch (error) {
            console.warn('⚠️ BGM読み込み失敗:', error);
        }
    },
    
    // SE再生
    play: function(soundName) {
        if (!this.seEnabled) {
            console.log('🔇 SE無効のため再生スキップ:', soundName);
            return;
        }
        
        const sound = this.sounds[soundName];
        if (sound) {
            try {
                // 再生位置をリセットして再生
                sound.currentTime = 0;
                sound.play();
                console.log('🔊 SE再生:', soundName);
            } catch (error) {
                console.warn('⚠️ SE再生エラー:', soundName, error);
            }
        } else {
            console.warn('❌ SE未登録:', soundName);
        }
    },
    
    // BGM再生開始（ユーザー操作後に実行）
    startBGM: function() {
        if (!this.bgmEnabled || !this.bgm || this.bgmStarted) {
            console.log('🎵 BGM無効、未読み込み、または既に開始済み');
            return;
        }
        
        try {
            this.bgm.currentTime = 0;
            const playPromise = this.bgm.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('🎵 BGM再生開始');
                    this.bgmStarted = true;
                }).catch(error => {
                    console.warn('⚠️ BGM自動再生エラー（ユーザー操作待ち）:', error.message);
                });
            }
        } catch (error) {
            console.warn('⚠️ BGM再生エラー:', error);
        }
    },
    
    // BGM停止
    stopBGM: function() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
            this.bgmStarted = false;
            console.log('🎵 BGM停止');
        }
    },
    
    // 音量設定
    setBGMVolume: function(volume) {
        if (this.bgm) {
            this.bgm.volume = volume / 100;
            console.log('🎵 BGM音量設定:', volume);
        }
    },
    
    setSEVolume: function(volume) {
        Object.values(this.sounds).forEach(sound => {
            sound.volume = volume / 100;
        });
        console.log('🔊 SE音量設定:', volume);
    },
    
    // SE有効/無効切り替え
    toggleSE: function() {
        this.seEnabled = !this.seEnabled;
        console.log('🔊 SE設定変更:', this.seEnabled ? '有効' : '無効');
        return this.seEnabled;
    },
    
    // BGM有効/無効切り替え
    toggleBGM: function() {
        this.bgmEnabled = !this.bgmEnabled;
        if (this.bgmEnabled) {
            this.startBGM();
        } else {
            this.stopBGM();
        }
        console.log('🎵 BGM設定変更:', this.bgmEnabled ? '有効' : '無効');
        return this.bgmEnabled;
    }
};

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
    turnOrder: [],
    messageHistory: []
};

// DOM要素
const elements = {
    phase: document.getElementById('current-phase'),
    turn: document.getElementById('turn-counter'),
    pp: document.getElementById('pp-counter'),
    victory: document.getElementById('victory-counter'),
    enemyHandCount: document.getElementById('enemy-hand-count'),
    enemyPP: document.getElementById('enemy-pp'),
    enemyVictory: document.getElementById('enemy-victory-counter'),
    message: document.getElementById('game-message'),
    playerHand: document.getElementById('player-hand'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    skipActionBtn: document.getElementById('skip-action-btn'),
    restartBtn: document.getElementById('restart-btn'),
    gameBackground: document.getElementById('game-background'),
    // スタート画面要素
    startScreen: document.getElementById('start-screen'),
    startBtn: document.getElementById('start-game-btn'),
    gameContainer: document.getElementById('game-container'),
    // 音響コントロール要素
    audioControls: document.getElementById('audio-controls'),
    audioToggle: document.getElementById('audio-toggle'),
    audioPanel: document.getElementById('audio-panel'),
    audioClose: document.getElementById('audio-close'),
    bgmToggle: document.getElementById('bgm-toggle'),
    seToggle: document.getElementById('se-toggle'),
    bgmVolume: document.getElementById('bgm-volume'),
    seVolume: document.getElementById('se-volume')
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
    if (elements.enemyVictory) elements.enemyVictory.textContent = `敵撃破: ${gameState.enemyDefeatedCost}/5`;
    
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
                        console.log('🎯 プレイヤーカードクリック:', gameState.playerField[i].name, 'で攻撃開始準備！');
                        event.stopPropagation(); // 親要素への伝播を防止
                        if (!gameState.attackMode) {
                            console.log('⚔️ 攻撃モード開始:', gameState.playerField[i].name, '→ 敵を選択してください');
                            startAttack(gameState.playerField[i]);
                        } else {
                            console.log('⚠️ 攻撃モード既に有効中です');
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
                    console.log('🎯 敵カード選択:', gameState.enemyField[i].name, '→ 攻撃実行します！');
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
    // 履歴に追加
    gameState.messageHistory.push({
        text: message,
        timestamp: Date.now()
    });
    
    // 履歴が20個を超えたら古いものを削除
    if (gameState.messageHistory.length > 20) {
        gameState.messageHistory.shift();
    }
    
    // メッセージエリアを更新
    updateMessageDisplay();
}

function updateMessageDisplay() {
    const messageElement = elements.message;
    const historyListElement = document.getElementById('message-history-list');
    
    // 最新のメッセージを表示
    const latestMessage = gameState.messageHistory[gameState.messageHistory.length - 1];
    if (latestMessage) {
        messageElement.textContent = latestMessage.text;
    }
    
    // 履歴リストを更新
    if (historyListElement) {
        historyListElement.innerHTML = '';
        
        // 最新10件を表示
        gameState.messageHistory.slice(-10).forEach(msg => {
            const item = document.createElement('div');
            item.className = 'message-history-item';
            
            // 敵の行動か判定
            if (msg.text.includes('敵の') || msg.text.includes('敵が')) {
                item.className += ' enemy-action';
            } else if (msg.text.includes('が') && msg.text.includes('に') && msg.text.includes('ダメージ')) {
                item.className += ' player-action';
            }
            
            item.textContent = msg.text;
            historyListElement.appendChild(item);
        });
        
        // 自動スクロール（最新のメッセージを表示）
        historyListElement.scrollTop = historyListElement.scrollHeight;
    }
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
        console.log('🃏 カード召喚:', card.name, `(コスト:${card.cost}, 残りPP:${gameState.playerPP}→${gameState.playerPP - card.cost})`);
        console.log('📊 召喚カード詳細:', {
            名前: card.name,
            属性: card.element,
            HP: card.hp,
            攻撃力: card.attack,
            スピード: card.speed,
            配置位置: `スロット${emptyIndex + 1}`
        });
        
        gameState.playerField[emptyIndex] = card;
        gameState.playerPP -= card.cost;
        gameState.playerHand = gameState.playerHand.filter(c => c.id !== card.id);
        
        // SE再生: カード召喚
        SoundManager.play('summon');
        
        showMessage(`${card.name}を召喚しました！`);
        updateDisplay();
    }
}

function startAttack(attacker) {
    console.log('⚔️ 攻撃準備:', attacker.name, '(HP:', attacker.hp, ', 攻撃力:', attacker.attack, ')');
    gameState.attackMode = true;
    gameState.currentAttacker = attacker;
    gameState.justStartedAttack = true;
    
    // SE再生: カード選択
    SoundManager.play('select');
    
    // 攻撃対象を選択できるようにする
    showMessage(`${attacker.name}の攻撃対象を選択してください（敵カード以外をクリックでキャンセル）`);
    
    // 少し遅延してからキャンセルリスナーを設定
    setTimeout(() => {
        console.log('✅ キャンセルリスナー設定完了 - 背景クリックで攻撃キャンセル可能');
        gameState.justStartedAttack = false;
        document.addEventListener('click', handleAttackCancelClick);
    }, 100);
    
    updateDisplay();
}

function handleAttackCancelClick(event) {
    console.log('🖱️ クリック検出:', event.target.tagName, '(', event.target.className, ')');
    
    // 攻撃モードでない場合は何もしない
    if (!gameState.attackMode) {
        console.log('⚠️ 攻撃モードではありません - キャンセル処理をスキップ');
        return;
    }
    
    // 攻撃開始直後の場合はキャンセルしない
    if (gameState.justStartedAttack) {
        console.log('⏱️ 攻撃開始直後のため - キャンセル処理をスキップ');
        return;
    }
    
    // クリックされた要素が敵カード（selectable-target）かチェック
    const clickedElement = event.target;
    const isEnemyCard = clickedElement.closest('.selectable-target');
    
    console.log('🔍 クリック要素判定:', isEnemyCard ? '敵カード' : 'その他');
    
    // 敵カードでない場合はキャンセル
    if (!isEnemyCard) {
        console.log('❌ 攻撃キャンセル: 敵カード以外をクリック');
        cancelAttack();
    } else {
        console.log('✅ 敵カードクリック - 攻撃続行');
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
    console.log('⚔️ 攻撃実行:', attacker.name, '→', target.name);
    console.log('💥 戦闘詳細:', {
        攻撃者: `${attacker.name} (攻撃力: ${attacker.attack})`,
        対象: `${target.name} (HP: ${target.hp}→${target.hp - attacker.attack})`
    });
    
    if (gameState.attackMode) {
        const damage = Math.max(1, attacker.attack);
        const originalHp = target.hp;
        target.hp -= damage;
        attacker.hasActed = true;
        
        console.log(`💢 ダメージ処理: ${damage}ダメージ → HP ${originalHp}→${target.hp}`);
        
        // SE再生: 攻撃
        SoundManager.play('attack');
        
        showMessage(`${attacker.name}が${target.name}に${damage}ダメージ！`);
        
        // HPが0以下になったらカードを撃破
        if (target.hp <= 0) {
            console.log('💀 カード撃破:', target.name, 'のHPが0以下になりました');
            defeatCard(target);
        } else {
            console.log('✅ カード生存:', target.name, `(残りHP: ${target.hp})`);
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
        console.log('⚠️ 攻撃モードではありません - executeAttack処理をスキップ');
    }
}

function enemyAutoAttack(enemyCard) {
    console.log('🤖 敵AI行動開始:', enemyCard.name, '(攻撃力:', enemyCard.attack, ')');
    const playerCards = gameState.playerField.filter(c => c !== null);
    console.log('🎯 攻撃可能なプレイヤーカード:', playerCards.map(c => `${c.name}(HP:${c.hp})`));
    
    // 攻撃対象がいない場合はスキップ
    if (playerCards.length === 0) {
        console.log('⚠️ 攻撃対象なし - 敵の行動をスキップ');
        enemyCard.hasActed = true;
        showMessage(`敵の${enemyCard.name}は攻撃対象がいないため行動をスキップしました`);
        
        updateDisplay();
        updateTurnOrderDisplay();
        
        // 次の行動者に移行
        setTimeout(() => {
            if (checkBattleEnd()) {
                nextPhase();
            } else {
                const nextCard = gameState.turnOrder.find(card => !card.hasActed);
                if (nextCard && !nextCard.isPlayer) {
                    enemyAutoAttack(nextCard);
                }
            }
        }, 1500);
        return;
    }
    
    if (playerCards.length > 0) {
        let target;
        const randomValue = Math.random();
        // 90%の確率で最もHPが低いカードを狙う
        if (randomValue < 0.9) {
            target = playerCards.reduce((lowest, card) => 
                card.hp < lowest.hp ? card : lowest
            );
            console.log('🤖 AI戦略: 最低HP狙い →', target.name, '(HP:', target.hp, ')');
        } else {
            target = playerCards[Math.floor(Math.random() * playerCards.length)];
            console.log('🤖 AI戦略: ランダム選択 →', target.name, '(HP:', target.hp, ')');
        }
        
        const damage = Math.max(1, enemyCard.attack);
        const originalHp = target.hp;
        target.hp -= damage;
        enemyCard.hasActed = true;
        
        console.log('⚔️ 敵攻撃実行:', `${enemyCard.name} → ${target.name}`, `(${damage}ダメージ, HP:${originalHp}→${target.hp})`);
        
        // SE再生: 敵の攻撃
        SoundManager.play('attack');
        
        showMessage(`敵の${enemyCard.name}が${target.name}に${damage}ダメージ！`);
        
        // HPが0以下になったらカードを撃破
        if (target.hp <= 0) {
            console.log('💀 敵の攻撃により撃破:', target.name);
            defeatCard(target);
        } else {
            console.log('✅ カード生存:', target.name, `(残りHP: ${target.hp})`);
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
    console.log('💀 カード撃破処理開始:', card.name, card.isPlayer ? '(プレイヤー)' : '(敵)');
    
    if (card.isPlayer) {
        const index = gameState.playerField.findIndex(c => c && c.id === card.id);
        if (index !== -1) {
            gameState.playerField[index] = null;
            gameState.enemyDefeatedCost += card.cost;
            console.log('🏆 敵の勝利ポイント:', gameState.enemyDefeatedCost, '/', 5, `(+${card.cost}コスト)`);
        }
    } else {
        const index = gameState.enemyField.findIndex(c => c && c.id === card.id);
        if (index !== -1) {
            gameState.enemyField[index] = null;
            gameState.defeatedCost += card.cost;
            console.log('🏆 プレイヤーの勝利ポイント:', gameState.defeatedCost, '/', 5, `(+${card.cost}コスト)`);
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
            cardElement.className = `turn-order-item ${card.element} ${card.isPlayer ? 'player' : 'enemy'}`;
            
            // プレイヤー🔵・敵🔴のマーカー追加
            const ownerMarker = card.isPlayer ? '🔵' : '🔴';
            
            cardElement.innerHTML = `
                <span class="owner-marker">${ownerMarker}</span>
                <div class="card-info">
                    <div class="card-name">${card.name}</div>
                    <div class="card-speed">⚡${card.speed}</div>
                </div>
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
    console.log('🔄 ターン', gameState.turn, '開始');
    
    // PP増加（両者）
    const oldMaxPP = gameState.maxPP;
    const oldEnemyMaxPP = gameState.enemyMaxPP;
    gameState.maxPP = Math.min(gameState.maxPP + 1, 5);
    gameState.playerPP = gameState.maxPP;
    gameState.enemyMaxPP = Math.min(gameState.enemyMaxPP + 1, 5);
    gameState.enemyPP = gameState.enemyMaxPP;
    
    console.log('💎 PP増加:');
    console.log('  プレイヤー:', `${oldMaxPP}→${gameState.maxPP}PP (現在PP: ${gameState.playerPP})`);
    console.log('  敵:', `${oldEnemyMaxPP}→${gameState.enemyMaxPP}PP (現在PP: ${gameState.enemyPP})`);
    
    // ドロー（両者）
    if (gameState.playerDeck.length > 0 && gameState.playerHand.length < 7) {
        const drawnCard = gameState.playerDeck.pop();
        gameState.playerHand.push(drawnCard);
        console.log('🎴 プレイヤードロー:', drawnCard.name, `(手札: ${gameState.playerHand.length}/7枚)`);
    } else {
        console.log('⚠️ プレイヤーはドローできません', `(デッキ: ${gameState.playerDeck.length}枚, 手札: ${gameState.playerHand.length}/7枚)`);
    }
    
    if (gameState.enemyDeck.length > 0 && gameState.enemyHand.length < 7) {
        const drawnCard = gameState.enemyDeck.pop();
        gameState.enemyHand.push(drawnCard);
        console.log('🎴 敵ドロー:', drawnCard.name, `(手札: ${gameState.enemyHand.length}/7枚)`);
    } else {
        console.log('⚠️ 敵はドローできません', `(デッキ: ${gameState.enemyDeck.length}枚, 手札: ${gameState.enemyHand.length}/7枚)`);
    }
    
    gameState.phase = 'summon';
    showMessage('新しいターン開始！カードを配置してください');
    updateDisplay();
}

function enemyAISummon() {
    console.log('🤖 敵AI召喚フェーズ開始 - 利用可能PP:', gameState.enemyPP);
    console.log('🃏 敵の手札:', gameState.enemyHand.map(c => `${c.name}(コスト:${c.cost})`));
    
    if (gameState.enemyHand.length > 0) {
        // コストが高い順にソート
        const sortedCards = gameState.enemyHand.sort((a, b) => b.cost - a.cost);
        console.log('📈 召喚優先順位(コスト降順):', sortedCards.map(c => `${c.name}(${c.cost})`));
        const summonedCards = [];
        
        // PPが続く限り、コストの高いカードから順番に召喚
        for (const card of sortedCards) {
            if (gameState.enemyPP >= card.cost && hasEmptySlot(gameState.enemyField)) {
                const emptyIndex = gameState.enemyField.findIndex(slot => slot === null);
                console.log('🃏 敵カード召喚:', card.name, `(コスト:${card.cost}, スロット:${emptyIndex + 1}, 残りPP:${gameState.enemyPP}→${gameState.enemyPP - card.cost})`);
                
                gameState.enemyField[emptyIndex] = card;
                gameState.enemyPP -= card.cost;
                gameState.enemyHand = gameState.enemyHand.filter(c => c.id !== card.id);
                summonedCards.push(card.name);
            } else {
                const reason = gameState.enemyPP < card.cost ? 'PP不足' : 'フィールド満杯';
                console.log('❌ 召喚できません:', card.name, `(理由:${reason})`);
            }
        }
        
        if (summonedCards.length > 0) {
            console.log('✅ 敵召喚完了:', summonedCards);
            
            // SE再生: 敵カード召喚（少し遅延）
            setTimeout(() => {
                SoundManager.play('summon');
            }, 500);
            
            showMessage(`敵が${summonedCards.join('、')}を召喚！`);
            updateDisplay();
        } else {
            console.log('⚠️ 敵は何も召喚できませんでした');
        }
    }
}

function checkWinCondition() {
    // プレイヤーの勝利条件：敵カード5コスト撃破
    if (gameState.defeatedCost >= 5) {
        setTimeout(() => {
            // SE再生: 勝利
            SoundManager.play('victory');
            showMessage('🎉 勝利！おめでとうございます！🎉');
            gameState.phase = 'gameover';
            elements.endTurnBtn.disabled = true;
        }, 1000);
        return true;
    }
    
    // 敵の勝利条件：プレイヤーカード5コスト撃破
    if (gameState.enemyDefeatedCost >= 5) {
        setTimeout(() => {
            // SE再生: 敗北
            SoundManager.play('defeat');
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
    // SE初期化（ゲーム開始時のみ）
    if (!SoundManager.sounds.summon) {
        SoundManager.init();
    }
    
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
    
    // BGM再生は最初のユーザー操作で開始
}

// スタート画面のイベントリスナー
elements.startBtn.addEventListener('click', () => {
    // SE再生: ボタン
    SoundManager.play('button');
    
    // BGM開始（初回ユーザー操作）
    SoundManager.startBGM();
    
    // スタート画面を非表示にしてゲーム開始
    elements.startScreen.style.display = 'none';
    elements.gameContainer.style.display = 'block';
    elements.audioControls.style.display = 'block';
    
    // ゲーム初期化
    initializeGame();
});

// 音響コントロールのイベントリスナー
elements.audioToggle.addEventListener('click', () => {
    const panel = elements.audioPanel;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

elements.audioClose.addEventListener('click', () => {
    elements.audioPanel.style.display = 'none';
});

elements.bgmToggle.addEventListener('click', () => {
    const enabled = SoundManager.toggleBGM();
    elements.bgmToggle.textContent = enabled ? 'ON' : 'OFF';
    elements.bgmToggle.className = enabled ? 'toggle-btn' : 'toggle-btn off';
});

elements.seToggle.addEventListener('click', () => {
    const enabled = SoundManager.toggleSE();
    elements.seToggle.textContent = enabled ? 'ON' : 'OFF';
    elements.seToggle.className = enabled ? 'toggle-btn' : 'toggle-btn off';
});

elements.bgmVolume.addEventListener('input', (e) => {
    SoundManager.setBGMVolume(e.target.value);
});

elements.seVolume.addEventListener('input', (e) => {
    SoundManager.setSEVolume(e.target.value);
});

// ゲームイベントリスナー
elements.endTurnBtn.addEventListener('click', () => {
    // SE再生: ボタン
    SoundManager.play('button');
    
    if (gameState.phase === 'summon') {
        nextPhase();
    } else if (gameState.phase === 'battle') {
        nextPhase();
    }
});

elements.skipActionBtn.addEventListener('click', () => {
    // SE再生: ボタン
    SoundManager.play('button');
    
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
    // SE再生: ボタン
    SoundManager.play('button');
    
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
        turnOrder: [],
        messageHistory: []
    };
    
    // ボタンの初期化
    elements.endTurnBtn.style.display = 'inline-block';
    elements.skipActionBtn.style.display = 'none';
    
    // ゲーム再開
    initializeGame();
});

// ゲーム開始
initializeGame();