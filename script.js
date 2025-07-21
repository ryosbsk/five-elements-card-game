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

// 五行相剋システム
const elementalEffectiveness = {
    木: "土",  // 木が土を突き破る
    火: "金",  // 火が金属を溶かす  
    土: "水",  // 土が水を吸収
    金: "木",  // 金属が木を切る
    水: "火"   // 水が火を消す
};

// 🌟 五行アイコンマッピング
const elementIcons = {
    火: '🔥',
    水: '💧', 
    木: '🌿',
    金: '🥇',
    土: '🪨'
};

// カードデータ
const cardData = [
    // コスト1カード
    { name: "火花", element: "火", hp: 20, attack: 16, speed: 4, cost: 1 },
    { name: "小石", element: "土", hp: 25, attack: 14, speed: 1, cost: 1 },
    { name: "鋼片", element: "金", hp: 23, attack: 14, speed: 3, cost: 1 },
    { name: "水滴", element: "水", hp: 24, attack: 11, speed: 5, cost: 1 },
    { name: "若芽", element: "木", hp: 28, attack: 10, speed: 2, cost: 1 },
    
    // コスト2カード  
    { name: "炎の鳥", element: "火", hp: 22, attack: 18, speed: 6, cost: 2 },
    { name: "岩の巨人", element: "土", hp: 27, attack: 16, speed: 3, cost: 2 },
    { name: "鋼の狼", element: "金", hp: 25, attack: 16, speed: 5, cost: 2 },
    { name: "水の精霊", element: "水", hp: 26, attack: 13, speed: 7, cost: 2 },
    { name: "森の精", element: "木", hp: 30, attack: 12, speed: 4, cost: 2 }
];

// ゲーム状態
let gameState = {
    phase: 'draw',
    turn: 1,
    playerPP: 1,
    maxPP: 1,
    enemyPP: 1,
    gameOver: false, // ゲーム終了フラグ
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
    currentEnemyAttacker: null, // 現在攻撃準備中の敵カード
    simultaneousCombatCards: [], // 現在相打ち中のカード
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
    // 統合コントロールパネル要素
    controlPanel: document.getElementById('control-panel'),
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
        <div class="card-content-vertical">
            <div class="card-name">
                <span class="element-cost-overlay">
                    <span class="element-icon">${elementIcons[card.element]}</span>
                    <span class="cost-number">${card.cost}</span>
                </span>
                ${card.name}
            </div>
            <div class="card-stats-overlay">
                <div class="stat-overlay">
                    <span class="stat-icon">❤️</span>
                    <span class="stat-number">${card.hp}</span>
                </div>
                <div class="stat-overlay">
                    <span class="stat-icon">⚔️</span>
                    <span class="stat-number">${card.attack}</span>
                </div>
                <div class="stat-overlay">
                    <span class="stat-icon">⚡</span>
                    <span class="stat-number">${card.speed}</span>
                </div>
            </div>
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
    if (elements.enemyHandCount) elements.enemyHandCount.textContent = `💳${gameState.enemyHand.length}枚`;
    if (elements.enemyPP) elements.enemyPP.textContent = `💎${gameState.enemyPP}/${gameState.enemyMaxPP}`;
    if (elements.enemyVictory) elements.enemyVictory.textContent = `🏆${gameState.enemyDefeatedCost}/5`;
    
    // プレイヤーコンパクト情報更新
    const playerPPCompact = document.getElementById('player-pp-compact');
    const playerVictoryCompact = document.getElementById('player-victory-compact');
    const playerTurnCompact = document.getElementById('player-turn-compact');
    
    if (playerPPCompact) playerPPCompact.textContent = `💎${gameState.playerPP}/${gameState.maxPP}`;
    if (playerVictoryCompact) playerVictoryCompact.textContent = `🏆${gameState.defeatedCost}/5`;
    if (playerTurnCompact) playerTurnCompact.textContent = `🔄ターン${gameState.turn}`;
    
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
    
    // 🔍 フェーズスキップ検出機能
    detectPhaseSkip();
}

function detectPhaseSkip() {
    // 召喚フェーズなのに配置可能な状況がチェック
    if (gameState.phase === 'summon') {
        const hasEmptySlots = gameState.playerField.includes(null);
        const hasPlayableCards = gameState.playerHand.some(card => gameState.playerPP >= card.cost);
        const canPlay = hasEmptySlots && hasPlayableCards;
        
        // フェーズスキップの可能性がある条件をログ出力
        if (!canPlay) {
            console.log('⚠️ 召喚フェーズだが配置不可能な状況を検出:', {
                空きスロットあり: hasEmptySlots,
                配置可能カードあり: hasPlayableCards,
                プレイヤーPP: gameState.playerPP,
                手札: gameState.playerHand.map(c => `${c.name}(コスト:${c.cost})`),
                フィールド状況: gameState.playerField.map((c, i) => c ? `${i}:${c.name}` : `${i}:空`),
                この状況でスキップされる可能性: 'この後自動的に戦闘フェーズに移行する可能性があります'
            });
        }
        
        // 敵フィールド満杯チェック
        const enemyFieldFull = gameState.enemyField.every(c => c !== null);
        if (enemyFieldFull && !canPlay) {
            console.log('🚨 フェーズスキップ高確率状況:', {
                敵フィールド満杯: enemyFieldFull,
                プレイヤー配置不可: !canPlay,
                推定原因: '敵フィールド満杯 + プレイヤー配置不可能でスキップが発生する可能性'
            });
        }
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
            if (gameState.gameOver) {
                console.log('🚫 ゲーム終了済み - カード選択無効');
                return;
            }
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
            
            // 相打ちシステム削除済み
            
            // 戦闘フェーズでの攻撃クリック
            if (gameState.phase === 'battle' && !gameState.playerField[i].hasActed) {
                // 現在の行動順序をチェック
                const currentTurnCard = gameState.turnOrder.find(card => !card.hasActed);
                if (currentTurnCard && currentTurnCard.id === gameState.playerField[i].id) {
                    cardElement.addEventListener('click', (event) => {
                        if (gameState.gameOver) {
                            console.log('🚫 ゲーム終了済み - 攻撃選択無効');
                            return;
                        }
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
            
            // 敵行動待機アニメーション（統一）🤖
            if (gameState.phase === 'battle' && !gameState.enemyField[i].hasActed) {
                const currentTurnCard = gameState.turnOrder.find(card => !card.hasActed);
                if (currentTurnCard && currentTurnCard.id === gameState.enemyField[i].id) {
                    applyEnemyActionAnimation(cardElement, gameState.enemyField[i].name);
                    cardElement.classList.add('enemy-turn');
                }
            }
            
            // 敵行動アニメーション（統一） 🤖
            if (gameState.currentEnemyAttacker && gameState.currentEnemyAttacker.id === gameState.enemyField[i].id) {
                applyEnemyActionAnimation(cardElement, gameState.enemyField[i].name);
            }
            
            // 相打ちシステム削除済み
            
            // 攻撃対象として選択可能
            if (gameState.attackMode) {
                cardElement.classList.add('selectable-target');
                cardElement.addEventListener('click', (event) => {
                    if (gameState.gameOver) {
                        console.log('🚫 ゲーム終了済み - 攻撃実行無効');
                        return;
                    }
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

// 攻撃モード中に敵フィールドのみ更新する関数
function updateEnemyFieldOnly() {
    // 敵フィールド
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`enemy-slot-${i}`);
        if (gameState.enemyField[i]) {
            const cardElement = createCardElement(gameState.enemyField[i]);
            
            // 敵行動待機アニメーション（統一）🤖
            if (gameState.phase === 'battle' && !gameState.enemyField[i].hasActed) {
                const currentTurnCard = gameState.turnOrder.find(card => !card.hasActed);
                if (currentTurnCard && currentTurnCard.id === gameState.enemyField[i].id) {
                    applyEnemyActionAnimation(cardElement, gameState.enemyField[i].name);
                    cardElement.classList.add('enemy-turn');
                }
            }
            
            // 敵行動アニメーション（統一） 🤖
            if (gameState.currentEnemyAttacker && gameState.currentEnemyAttacker.id === gameState.enemyField[i].id) {
                applyEnemyActionAnimation(cardElement, gameState.enemyField[i].name);
            }
            
            // 攻撃対象として選択可能 + 予測ダメージ表示
            if (gameState.attackMode && gameState.currentAttacker) {
                cardElement.classList.add('selectable-target');
                
                // 予測ダメージを表示
                const damageInfo = calculateElementalDamage(gameState.currentAttacker, gameState.enemyField[i]);
                const canKill = gameState.enemyField[i].hp <= damageInfo.damage;
                
                const damageElement = document.createElement('div');
                damageElement.className = 'damage-preview-integrated';
                damageElement.innerHTML = canKill ? 
                    `-${damageInfo.damage} 💀` : 
                    `-${damageInfo.damage}`;
                damageElement.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(220, 53, 69, 0.95);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 14px;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    z-index: 100;
                    animation: damagePreviewPulse 1.5s ease-in-out infinite;
                    pointer-events: none;
                `;
                
                cardElement.appendChild(damageElement);
                console.log(`✨ [${i}] 統合予測ダメージ表示:`, gameState.enemyField[i].name, `→ ${damageInfo.damage}ダメージ`);
                
                cardElement.addEventListener('click', (event) => {
                    if (gameState.gameOver) {
                        console.log('🚫 ゲーム終了済み - 攻撃実行無効');
                        return;
                    }
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
    
    // 敵カードに予測ダメージを表示（統合ソリューションで代替）
    // showDamagePreview(attacker);
    
    // 少し遅延してからキャンセルリスナーを設定
    setTimeout(() => {
        console.log('✅ キャンセルリスナー設定完了 - 背景クリックで攻撃キャンセル可能');
        gameState.justStartedAttack = false;
        document.addEventListener('click', handleAttackCancelClick);
    }, 100);
    
    // 攻撃モード中は敵フィールドのみ更新（予測ダメージを保持するため）
    if (gameState.attackMode) {
        updateEnemyFieldOnly();
    } else {
        updateDisplay();
    }
}

// 敵行動アニメーション統一関数
function applyEnemyActionAnimation(cardElement, cardName) {
    cardElement.classList.add('selectable'); // pulseアニメーション統一
    console.log('🎯 敵行動アニメーション適用:', cardName);
}

// 予測ダメージ表示
function showDamagePreview(attacker) {
    console.log('🎯 showDamagePreview 開始:', attacker.name);
    
    gameState.enemyField.forEach((enemy, index) => {
        if (enemy) {
            const damageInfo = calculateElementalDamage(attacker, enemy);
            const canKill = enemy.hp <= damageInfo.damage;
            
            // 敵カードのDOM要素を取得
            const slot = document.getElementById(`enemy-slot-${index}`);
            const enemyCardElement = slot ? slot.querySelector('.card') : null;
            
            console.log(`🔍 [${index}] ${enemy.name}:`, enemyCardElement ? 'カード要素あり' : 'カード要素なし');
            
            // DOM構造の詳細調査
            if (enemyCardElement) {
                console.log(`🏗️ [${index}] DOM構造:`, {
                    'カード要素': enemyCardElement.tagName,
                    'カードクラス': enemyCardElement.className,
                    'カードID': enemyCardElement.id,
                    '親要素': enemyCardElement.parentElement?.tagName,
                    '親クラス': enemyCardElement.parentElement?.className,
                    '子要素数': enemyCardElement.children.length,
                    '子要素リスト': Array.from(enemyCardElement.children).map(child => child.className)
                });
            }
            
            if (enemyCardElement) {
                // 既存の予測ダメージ表示を削除
                const existingPreview = enemyCardElement.querySelector('.damage-preview');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                // 予測ダメージ要素を作成
                const previewElement = document.createElement('div');
                previewElement.className = 'damage-preview';
                previewElement.innerHTML = canKill ? 
                    `-${damageInfo.damage} 💀` : 
                    `-${damageInfo.damage}`;
                
                // デバッグ用: 一時的に目立つスタイルを追加
                previewElement.style.cssText = `
                    position: absolute !important;
                    top: 10px !important;
                    left: 10px !important;
                    background: red !important;
                    color: white !important;
                    padding: 10px !important;
                    z-index: 9999 !important;
                    font-size: 16px !important;
                    border: 3px solid yellow !important;
                    transform: none !important;
                `;
                
                // カードに追加（card-content-vertical内にも試す）
                const cardContent = enemyCardElement.querySelector('.card-content-vertical');
                if (cardContent) {
                    console.log(`📦 [${index}] card-content-vertical内に追加テスト`);
                    
                    // card-content-verticalのCSS制限を調査
                    const cardContentStyle = getComputedStyle(cardContent);
                    console.log(`🎨 [${index}] card-content-verticalのCSS:`, {
                        overflow: cardContentStyle.overflow,
                        position: cardContentStyle.position,
                        zIndex: cardContentStyle.zIndex,
                        display: cardContentStyle.display,
                        visibility: cardContentStyle.visibility
                    });
                    
                    cardContent.appendChild(previewElement);
                    
                    // ゲームコンテナに予測ダメージを絶対位置で表示（解決案）
                    const gameContainer = document.getElementById('game-container');
                    const cardRect = enemyCardElement.getBoundingClientRect();
                    const gameRect = gameContainer.getBoundingClientRect();
                    
                    const damageDisplayElement = document.createElement('div');
                    damageDisplayElement.className = 'damage-preview-overlay';
                    damageDisplayElement.innerHTML = canKill ? 
                        `-${damageInfo.damage} 💀` : 
                        `-${damageInfo.damage}`;
                    damageDisplayElement.style.cssText = `
                        position: absolute !important;
                        top: ${cardRect.top - gameRect.top + cardRect.height * 0.65}px !important;
                        left: ${cardRect.left - gameRect.left + cardRect.width * 0.5 - 24}px !important;
                        background: rgba(220, 53, 69, 0.95) !important;
                        color: white !important;
                        padding: 6px 12px !important;
                        border-radius: 16px !important;
                        font-size: 14px !important;
                        font-weight: bold !important;
                        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8) !important;
                        border: 2px solid rgba(255, 255, 255, 0.3) !important;
                        z-index: 1000 !important;
                        animation: damagePreviewPulse 1.5s ease-in-out infinite !important;
                        pointer-events: none !important;
                    `;
                    
                    if (gameContainer) {
                        gameContainer.appendChild(damageDisplayElement);
                        console.log(`✨ [${index}] 予測ダメージをゲームコンテナに表示`);
                    }
                } else {
                    console.log(`📦 [${index}] card要素に直接追加`);
                    enemyCardElement.appendChild(previewElement);
                }
                
                // 最終テスト: bodyに直接追加
                const bodyTestElement = document.createElement('div');
                bodyTestElement.innerHTML = `テスト: ${enemy.name}`;
                bodyTestElement.style.cssText = `
                    position: fixed !important;
                    top: 50px !important;
                    left: 50px !important;
                    background: blue !important;
                    color: white !important;
                    padding: 20px !important;
                    z-index: 99999 !important;
                    font-size: 20px !important;
                    border: 5px solid orange !important;
                `;
                document.body.appendChild(bodyTestElement);
                console.log('🧪 bodyテスト要素追加:', bodyTestElement);
                
                console.log('💭 予測ダメージ表示:', enemy.name, `→ ${damageInfo.damage}ダメージ`, canKill ? '(撃破可能💀)' : '');
                
                // 追加後の確認
                const addedElement = enemyCardElement.querySelector('.damage-preview');
                console.log(`✅ [${index}] 追加確認:`, addedElement ? '存在する' : '存在しない');
                
                // 3秒後に再確認
                setTimeout(() => {
                    const stillExists = enemyCardElement.querySelector('.damage-preview');
                    console.log(`⏰ [${index}] 3秒後確認:`, stillExists ? '存在する' : '削除された');
                    if (!stillExists) {
                        console.log('🚨 要素が削除されました！');
                    }
                }, 3000);
                if (addedElement) {
                    const rect = addedElement.getBoundingClientRect();
                    const parentRect = enemyCardElement.getBoundingClientRect();
                    console.log(`🔍 [${index}] CSS確認:`, {
                        display: getComputedStyle(addedElement).display,
                        visibility: getComputedStyle(addedElement).visibility,
                        opacity: getComputedStyle(addedElement).opacity,
                        zIndex: getComputedStyle(addedElement).zIndex,
                        position: getComputedStyle(addedElement).position,
                        width: addedElement.offsetWidth + 'px',
                        height: addedElement.offsetHeight + 'px'
                    });
                    console.log(`📍 [${index}] 位置情報:`, {
                        '要素位置': `x:${rect.left.toFixed(1)}, y:${rect.top.toFixed(1)}`,
                        '親カード位置': `x:${parentRect.left.toFixed(1)}, y:${parentRect.top.toFixed(1)}`,
                        '親カードサイズ': `${parentRect.width.toFixed(1)}×${parentRect.height.toFixed(1)}`,
                        '画面内判定': rect.left >= 0 && rect.top >= 0 && rect.right <= window.innerWidth && rect.bottom <= window.innerHeight ? '画面内' : '画面外'
                    });
                }
            }
        }
    });
    
    console.log('🎯 showDamagePreview 完了');
}

// 予測ダメージ表示を削除
function hideDamagePreview() {
    // 元のカード内要素を削除
    document.querySelectorAll('.damage-preview').forEach(element => {
        element.remove();
    });
    // ゲームコンテナ内のオーバーレイ要素も削除
    document.querySelectorAll('.damage-preview-overlay').forEach(element => {
        element.remove();
    });
    console.log('🧹 予測ダメージ全削除（オーバーレイ含む）');
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
    
    // 予測ダメージ表示を削除
    hideDamagePreview();
    
    // 全体クリックイベントを削除
    document.removeEventListener('click', handleAttackCancelClick);
    
    showMessage('攻撃をキャンセルしました');
    updateDisplay();
}

// 五行相剋ダメージ計算
function calculateElementalDamage(attacker, target) {
    const baseDamage = Math.max(1, attacker.attack);
    
    // 相剋関係をチェック
    if (elementalEffectiveness[attacker.element] === target.element) {
        const elementalBonus = attacker.cost === 1 ? 3 : 5;
        return {
            damage: baseDamage + elementalBonus,
            isEffective: true,
            bonus: elementalBonus,
            message: `${attacker.element}が${target.element}に効果的！`
        };
    }
    
    return {
        damage: baseDamage,
        isEffective: false,
        bonus: 0,
        message: null
    };
}

// 同速相打ち判定とダメージ処理
function processSimultaneousCombat(attacker, target) {
    console.log('⚡ 同速相打ち発生:', `${attacker.name}(速度:${attacker.speed}) vs ${target.name}(速度:${target.speed})`);
    
    // 💥 相打ちアニメーション開始
    gameState.simultaneousCombatCards = [attacker, target];
    console.log('💥 相打ちアニメーション開始:', attacker.name, 'vs', target.name);
    
    // 両方のダメージを計算
    const attackerDamage = calculateElementalDamage(attacker, target);
    const counterDamage = calculateElementalDamage(target, attacker);
    
    // 元のHP記録
    const attackerOriginalHp = attacker.hp;
    const targetOriginalHp = target.hp;
    
    // 同時ダメージ適用
    attacker.hp -= counterDamage.damage;
    target.hp -= attackerDamage.damage;
    
    console.log('💥 相打ちダメージ詳細:', {
        [`${attacker.name}が与えるダメージ`]: `${attackerDamage.damage} (${attackerDamage.isEffective ? '効果的' : '通常'})`,
        [`${target.name}が与えるダメージ`]: `${counterDamage.damage} (${counterDamage.isEffective ? '効果的' : '通常'})`,
        [`${attacker.name}のHP`]: `${attackerOriginalHp} → ${attacker.hp}`,
        [`${target.name}のHP`]: `${targetOriginalHp} → ${target.hp}`
    });
    
    // 両方とも行動済みにマーク
    attacker.hasActed = true;
    target.hasActed = true;
    
    // SE再生: 攻撃
    SoundManager.play('attack');
    
    // 相打ちエフェクト表示
    showSlashEffect(target, attackerDamage.isEffective, attacker.element);
    showSlashEffect(attacker, counterDamage.isEffective, target.element);
    
    // ダメージアニメーション（少し遅延して同時表示）
    setTimeout(() => {
        showDamageAnimation(target, attackerDamage, attacker.element);
        showDamageAnimation(attacker, counterDamage, target.element);
    }, 150);
    
    // 相打ちメッセージ
    let message = '⚡ 相打ち！ ';
    if (attackerDamage.isEffective || counterDamage.isEffective) {
        const effectMessages = [];
        if (attackerDamage.isEffective) effectMessages.push(attackerDamage.message);
        if (counterDamage.isEffective) effectMessages.push(counterDamage.message);
        message += effectMessages.join(' / ') + ' ';
    }
    const attackerText = attackerDamage.isEffective ? `${attackerDamage.damage}(+${attackerDamage.bonus})` : attackerDamage.damage;
    const counterText = counterDamage.isEffective ? `${counterDamage.damage}(+${counterDamage.bonus})` : counterDamage.damage;
    message += `${attacker.name}⚔️${target.name} 同時${attackerText}/${counterText}ダメージ！`;
    showMessage(message);
    
    // 撃破判定（同時撃破の可能性）
    const attackerDefeated = attacker.hp <= 0;
    const targetDefeated = target.hp <= 0;
    
    return {
        attackerDefeated,
        targetDefeated,
        attackerDamage: attackerDamage.damage,
        counterDamage: counterDamage.damage
    };
}

function executeAttack(attacker, target) {
    console.log('⚔️ 攻撃実行:', attacker.name, '→', target.name);
    console.log('💥 戦闘詳細:', {
        攻撃者: `${attacker.name} (${attacker.element}属性, 攻撃力: ${attacker.attack}, 速度: ${attacker.speed})`,
        対象: `${target.name} (${target.element}属性, HP: ${target.hp}, 速度: ${target.speed})`
    });
    
    // 予測ダメージ表示を削除
    hideDamagePreview();
    
    if (gameState.attackMode) {
        // 🎯 プレイヤー先行制: 同速度でもプレイヤーが先に行動
        console.log('👤 プレイヤー攻撃実行 (同速度でも先行)');
        
        // 通常攻撃（速度が異なる、または対象が既に行動済み）
        const damageInfo = calculateElementalDamage(attacker, target);
        const originalHp = target.hp;
        target.hp -= damageInfo.damage;
        attacker.hasActed = true;
        
        console.log(`💢 ダメージ処理: ${damageInfo.damage}ダメージ (効果的: ${damageInfo.isEffective}) → HP ${originalHp}→${target.hp}`);
        
        // SE再生: 攻撃
        SoundManager.play('attack');
        
        // スラッシュエフェクト表示（攻撃開始）
        showSlashEffect(target, damageInfo.isEffective, attacker.element);
        
        // ダメージアニメーション表示（少し遅延）
        setTimeout(() => {
            showDamageAnimation(target, damageInfo, attacker.element);
        }, 150);
        
        // 相剋効果に応じたメッセージ表示
        if (damageInfo.isEffective) {
            showMessage(`🔥 ${damageInfo.message} ${attacker.name}が${target.name}に${damageInfo.damage}ダメージ(+${damageInfo.bonus})！`);
        } else {
            showMessage(`⚔️ ${attacker.name}が${target.name}に${damageInfo.damage}ダメージ！`);
        }
        
        // HPチェックは即座に行い、撃破処理はアニメーション後に遅延実行
        const isDefeated = target.hp <= 0;
        if (isDefeated) {
            console.log('💀 カード撃破予定:', target.name, 'のHPが0以下 → アニメーション後に撃破処理');
            
            // ダメージアニメーション完了後にカード撃破処理
            setTimeout(() => {
                if (target.hp <= 0) { // 念のため再チェック
                    defeatCard(target);
                }
            }, 1200); // ダメージアニメーション時間(1000ms) + 余裕(200ms)
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
        
        // 撃破しなかった場合のみ戦闘継続チェック
        if (!isDefeated) {
            setTimeout(() => {
                const victoryCheck = checkVictoryCondition();
                if (victoryCheck.result) {
                    gameOver(victoryCheck.result, victoryCheck.message, victoryCheck.sound);
                    return;
                }
                
                // 戦闘継続チェック
                if (checkBattleEnd()) {
                    nextPhase();
                } else {
                    // 次の行動者がAIの場合、自動で行動
                    const nextCard = gameState.turnOrder.find(card => !card.hasActed);
                    if (nextCard && !nextCard.isPlayer) {
                        enemyAutoAttack(nextCard);
                    }
                }
            }, 500);
        }
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
    
    // 🎬 Stage 1: 敵カードの攻撃待機アニメーション表示
    console.log('🎭 敵攻撃アニメーション開始:', enemyCard.name);
    gameState.currentEnemyAttacker = enemyCard; // 攻撃中の敵カードを記録
    showMessage(`🤖 敵の${enemyCard.name}が攻撃を準備しています...`);
    updateDisplay(); // 敵カードにenemy-attackingクラスを追加するため
    
    // 1000ms後に対象選択とメッセージ更新
    setTimeout(() => {
        // 🎬 Stage 2: 攻撃対象選択と表示
        enemySelectAndShowTarget(enemyCard, playerCards);
    }, 1000);
}

// 🎬 Stage 2: 敵の攻撃対象選択と表示
function enemySelectAndShowTarget(enemyCard, playerCards) {
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
    
    showMessage(`🎯 敵の${enemyCard.name}が${target.name}を狙っています...`);
    
    // 500ms後に実際の攻撃実行
    setTimeout(() => {
        // 🎬 Stage 3: 攻撃実行
        executeEnemyAttack(enemyCard, target);
    }, 500);
}

// 🎬 Stage 3: 敵の攻撃実行
function executeEnemyAttack(enemyCard, target) {
    // 🎬 攻撃実行開始 - アニメーション状態をクリア
    gameState.currentEnemyAttacker = null;
    console.log('⚔️ 敵攻撃実行:', enemyCard.name, '→', target.name);
    
    // 🤖 敵は同速度でもプレイヤー後攻で行動
    console.log('🤖 敵攻撃実行 (プレイヤーが既に行動済みの場合のみ実行)');
    
    // 通常攻撃（速度が異なる、または対象が既に行動済み）
    const damageInfo = calculateElementalDamage(enemyCard, target);
    const originalHp = target.hp;
    target.hp -= damageInfo.damage;
    enemyCard.hasActed = true;
    
    console.log('⚔️ 敵攻撃実行:', `${enemyCard.name} → ${target.name}`, `(${damageInfo.damage}ダメージ, 効果的: ${damageInfo.isEffective}, HP:${originalHp}→${target.hp})`);
    
    // SE再生: 敵の攻撃
    SoundManager.play('attack');
    
    // スラッシュエフェクト表示（攻撃開始）
    showSlashEffect(target, damageInfo.isEffective, enemyCard.element);
    
    // ダメージアニメーション表示（少し遅延）
    setTimeout(() => {
        showDamageAnimation(target, damageInfo, enemyCard.element);
    }, 150);
    
    // 相剋効果に応じたメッセージ表示
    if (damageInfo.isEffective) {
        showMessage(`🔥 ${damageInfo.message} 敵の${enemyCard.name}が${target.name}に${damageInfo.damage}ダメージ(+${damageInfo.bonus})！`);
    } else {
        showMessage(`⚔️ 敵の${enemyCard.name}が${target.name}に${damageInfo.damage}ダメージ！`);
    }
    
    // HPチェックは即座に行い、撃破処理はアニメーション後に遅延実行
    const isDefeated = target.hp <= 0;
    if (isDefeated) {
        console.log('💀 敵の攻撃により撃破予定:', target.name, 'のHPが0以下 → アニメーション後に撃破処理');
        
        // ダメージアニメーション完了後にカード撃破処理
        setTimeout(() => {
            if (target.hp <= 0) { // 念のため再チェック
                defeatCard(target);
            }
        }, 1200); // ダメージアニメーション時間(1000ms) + 余裕(200ms)
    } else {
        console.log('✅ カード生存:', target.name, `(残りHP: ${target.hp})`);
    }
    
    updateDisplay();
    updateTurnOrderDisplay();
    
    // 撃破しなかった場合のみ戦闘継続チェック
    if (!isDefeated) {
        setTimeout(() => {
            const victoryCheck = checkVictoryCondition();
            if (victoryCheck.result) {
                gameOver(victoryCheck.result, victoryCheck.message, victoryCheck.sound);
                return;
            }
            
            // 戦闘継続チェック
            if (checkBattleEnd()) {
                nextPhase();
            } else {
                // 次の行動者がいれば続行
                const nextCard = gameState.turnOrder.find(card => !card.hasActed);
                if (nextCard && !nextCard.isPlayer) {
                    enemyAutoAttack(nextCard);
                }
            }
        }, 500);
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
    updateDisplay(); // UI更新
    
    // 撃破後に勝敗判定を実行
    setTimeout(() => {
        const victoryCheck = checkVictoryCondition();
        if (victoryCheck.result) {
            gameOver(victoryCheck.result, victoryCheck.message, victoryCheck.sound);
            return;
        }
        
        // 戦闘継続チェック
        if (checkBattleEnd()) {
            nextPhase();
        } else {
            // 次の行動者に移行
            const nextCard = gameState.turnOrder.find(card => !card.hasActed);
            if (nextCard && !nextCard.isPlayer) {
                enemyAutoAttack(nextCard);
            }
        }
    }, 200); // 少し遅延して勝敗判定
    
    return false; // ゲーム続行
}

function checkBattleEnd() {
    // 全てのカードが行動済みかチェック
    const allActed = gameState.turnOrder.every(card => card.hasActed);
    
    console.log('🔍 戦闘終了チェック詳細:', {
        戦闘終了: allActed,
        行動順総数: gameState.turnOrder.length,
        行動済み数: gameState.turnOrder.filter(card => card.hasActed).length,
        未行動カード: gameState.turnOrder.filter(card => !card.hasActed).map(card => `${card.name}(${card.isPlayer ? 'プレイヤー' : '敵'})`)
    });
    
    if (allActed) {
        console.log('✅ 全員行動完了 - ターン終了処理へ');
        showMessage('全員の行動が完了しました。ターン終了します。');
    } else {
        console.log('⏳ まだ未行動のカードがあります');
    }
    
    return allActed;
}

function updateTurnOrderDisplay() {
    // 行動順UI更新関数
    // FF10風の行動順表示（全カード表示、行動済みはグレーアウト）
    const turnOrderElement = document.getElementById('turn-order');
    if (turnOrderElement) {
        turnOrderElement.innerHTML = '';
        const unactedCards = gameState.turnOrder.filter(card => !card.hasActed);
        
        // 全カードを表示
        gameState.turnOrder.forEach((card, globalIndex) => {
            const cardElement = document.createElement('div');
            cardElement.className = `turn-order-mini ${card.isPlayer ? 'player-mini' : 'enemy-mini'}`;
            
            // 行動済みカードはグレーアウトクラスを追加
            if (card.hasActed) {
                cardElement.classList.add('acted');
            }
            
            // 属性アイコン・カード名・速度をコンパクト表示
            const elementIcon = elementIcons[card.element];
            
            cardElement.innerHTML = `
                ${elementIcon}${card.name}
                <span class="element-cost-overlay">
                    <span class="element-icon">⚡</span>
                    <span class="cost-number">${card.speed}</span>
                </span>
            `;
            
            // 現在行動中のカードをハイライト（未行動の最初のカード）
            const unactedIndex = unactedCards.findIndex(unactedCard => unactedCard === card);
            if (unactedIndex === 0) {
                cardElement.classList.add('current-turn');
                // スクロール機能一時停止
                // setTimeout(() => {
                //     cardElement.scrollIntoView({
                //         behavior: 'smooth',
                //         block: 'nearest'
                //     });
                // }, 100);
            }
            
            turnOrderElement.appendChild(cardElement);
        });
        
        console.log('🔍 行動順表示更新:', {
            総カード数: gameState.turnOrder.length,
            行動済み数: gameState.turnOrder.filter(card => card.hasActed).length,
            未行動数: unactedCards.length,
            現在行動者: unactedCards[0]?.name || 'なし'
        });
    }
}

// フェーズポップアップ表示関数
function showPhasePopup(phaseName) {
    const phaseData = {
        'start': { icon: '🌅', text: 'ターン開始' },
        'summon': { icon: '📦', text: '召喚フェーズ' },
        'battle': { icon: '⚔️', text: '戦闘フェーズ' },
        'end': { icon: '🏁', text: 'ターン終了' }
    };

    const data = phaseData[phaseName];
    if (!data) return;

    const modal = document.getElementById('phase-popup-modal');
    const icon = document.getElementById('phase-popup-icon');
    const text = document.getElementById('phase-popup-text');
    const content = modal.querySelector('.phase-popup-content');

    icon.textContent = data.icon;
    text.textContent = data.text;

    // モーダル表示
    modal.style.display = 'flex';
    
    // アニメーション開始
    setTimeout(() => {
        content.classList.add('show');
    }, 50);

    // 0.8秒後に自動で閉じる
    setTimeout(() => {
        content.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
    }, 800);

    console.log('📋 フェーズポップアップ表示:', data.text);
}

function nextPhase() {
    const previousPhase = gameState.phase;
    console.log('🔄 フェーズ遷移開始:', {
        現在フェーズ: previousPhase,
        ターン: gameState.turn,
        プレイヤーフィールド: gameState.playerField.filter(c => c).map(c => c.name),
        敵フィールド: gameState.enemyField.filter(c => c).map(c => c.name),
        ログ記録時刻: new Date().toLocaleTimeString()
    });
    
    switch (gameState.phase) {
        case 'draw':
            gameState.phase = 'summon';
            showPhasePopup('summon');
            console.log('📦 召喚フェーズに遷移:', {
                プレイヤーPP: gameState.playerPP,
                プレイヤー手札数: gameState.playerHand.length,
                敵PP: gameState.enemyPP,
                敵手札数: gameState.enemyHand.length
            });
            showMessage('召喚フェーズ：カードを配置してください');
            break;
        case 'summon':
            console.log('⚔️ 戦闘フェーズに遷移開始:', {
                プレイヤーフィールド状況: gameState.playerField.map((c, i) => 
                    c ? `スロット${i}: ${c.name}(HP:${c.hp})` : `スロット${i}: 空`),
                敵フィールド状況: gameState.enemyField.map((c, i) => 
                    c ? `スロット${i}: ${c.name}(HP:${c.hp})` : `スロット${i}: 空`)
            });
            // 召喚フェーズ完了後、敵AI召喚
            enemyAISummon();
            gameState.phase = 'battle';
            showPhasePopup('battle');
            console.log('⚔️ 戦闘フェーズ遷移完了 - prepareBattle実行開始');
            prepareBattle();
            break;
        case 'battle':
            console.log('🏁 ターン終了処理開始:', {
                完了ターン: gameState.turn,
                プレイヤー撃破数: gameState.defeatedCost,
                敵撃破数: gameState.enemyDefeatedCost
            });
            gameState.phase = 'end';
            endTurn();
            break;
    }
    
    console.log('✅ フェーズ遷移完了:', {
        前フェーズ: previousPhase,
        新フェーズ: gameState.phase,
        処理完了時刻: new Date().toLocaleTimeString()
    });
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
    // 勝敗判定（ターン終了時にガラ空きチェックのみ）
    const victoryCheck = checkVictoryCondition();
    if (victoryCheck.result) {
        gameOver(victoryCheck.result, victoryCheck.message, victoryCheck.sound);
        return;
    }
    
    // 次のターンの準備
    gameState.turn++;
    console.log('🔄 ターン', gameState.turn, '開始');
    
    // ターン開始ポップアップ表示
    showPhasePopup('start');
    
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
    console.log('🔍 フェーズスキップ検出用ログ:', {
        新ターン: gameState.turn,
        設定フェーズ: gameState.phase,
        プレイヤー空きスロット: gameState.playerField.filter(c => c === null).length,
        敵空きスロット: gameState.enemyField.filter(c => c === null).length,
        プレイヤー手札あり: gameState.playerHand.length > 0,
        プレイヤーPP: gameState.playerPP,
        配置可能判定: gameState.playerHand.some(card => gameState.playerPP >= card.cost && gameState.playerField.includes(null))
    });
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

// 統合勝敗判定（撃破時に即座実行）
function checkVictoryCondition() {
    console.log('🔍 勝敗判定:', {
        プレイヤー撃破コスト: gameState.defeatedCost,
        敵撃破コスト: gameState.enemyDefeatedCost,
        プレイヤー場: gameState.playerField.filter(c => c !== null).length,
        プレイヤー手札: gameState.playerHand.length,
        敵場: gameState.enemyField.filter(c => c !== null).length,
        敵手札: gameState.enemyHand.length
    });
    
    // 1. 撃破コスト優先チェック（最優先）
    if (gameState.defeatedCost >= 5) {
        return { 
            result: "player_victory", 
            message: "🎉 勝利！5コスト撃破で勝利です！🎉",
            sound: "victory"
        };
    }
    if (gameState.enemyDefeatedCost >= 5) {
        return { 
            result: "enemy_victory", 
            message: "💀 敗北！敵に5コスト分撃破されました...",
            sound: "defeat"
        };
    }
    
    // 2. ガラ空きチェック（フィールドカードのみ、手札は除外）
    const playerCardsOnField = gameState.playerField.filter(c => c !== null);
    const enemyCardsOnField = gameState.enemyField.filter(c => c !== null);
    
    // 両方が空の場合は引き分け
    if (playerCardsOnField.length === 0 && enemyCardsOnField.length === 0) {
        return { 
            result: "draw", 
            message: "⚖️ 引き分け！両軍フィールドが同時に全滅しました",
            sound: "button"
        };
    }
    
    if (playerCardsOnField.length === 0) {
        return { 
            result: "player_defeat", 
            message: "💀 敗北！フィールドが空になりました...",
            sound: "defeat"
        };
    }
    if (enemyCardsOnField.length === 0) {
        return { 
            result: "enemy_defeat", 
            message: "🎉 勝利！敵のフィールドが空になりました！🎉",
            sound: "victory"
        };
    }
    
    return { result: null };
}

// ゲーム終了処理
function gameOver(result, message, sound) {
    console.log('🎮 ゲーム終了:', result, message);
    console.log('🔍 ゲーム終了時の状態:', {
        プレイヤー勝利ポイント: gameState.defeatedCost + '/5',
        敵勝利ポイント: gameState.enemyDefeatedCost + '/5',
        プレイヤーフィールド: gameState.playerField.filter(c => c !== null).length + '枚',
        敵フィールド: gameState.enemyField.filter(c => c !== null).length + '枚',
        ターン: gameState.turn,
        フェーズ: gameState.phase
    });
    
    gameState.gameOver = true; // ゲーム終了フラグを設定
    gameState.phase = 'gameover';
    elements.endTurnBtn.disabled = true;
    
    // 攻撃モードを解除
    if (gameState.attackMode) {
        gameState.attackMode = false;
        gameState.currentAttacker = null;
        console.log('🚫 攻撃モード強制解除（ゲーム終了）');
    }
    
    // 全イベントリスナーを削除
    document.removeEventListener('click', handleAttackCancelClick);
    
    setTimeout(() => {
        // SE再生
        SoundManager.play(sound);
        showMessage(message);
        updateDisplay(); // UI状態を更新
        
        // 🎉 勝敗結果モーダル表示
        showGameResultModal(result, message);
        console.log('🎭 勝敗結果モーダル表示:', result);
        console.log('✅ ゲーム終了処理完了');
    }, 500);
}

// 🎭 ゲーム結果モーダル表示
function showGameResultModal(result, message) {
    console.log('🔍 showGameResultModal 呼び出し:', { result, message });
    
    const modal = document.getElementById('game-result-modal');
    const icon = document.getElementById('result-icon');
    const title = document.getElementById('result-title');
    const messageElement = document.getElementById('result-message');
    
    // 結果に応じてアイコン・タイトル・色を設定
    let iconText, titleText, titleClass;
    
    console.log('🔍 switch文 実行前の result:', result);
    switch (result) {
        case 'victory':
        case 'player_victory':
        case 'enemy_defeat':
            iconText = '🎉';
            titleText = '勝利';
            titleClass = 'victory';
            console.log('🏆 勝利ケース適用');
            break;
        case 'defeat':
        case 'player_defeat':
        case 'enemy_victory':
            iconText = '😵';
            titleText = '敗北';
            titleClass = 'defeat';
            console.log('💀 敗北ケース適用');
            break;
        case 'draw':
            iconText = '🤝';
            titleText = '引き分け';
            titleClass = 'draw';
            console.log('🤝 引き分けケース適用');
            break;
        default:
            iconText = '🏁';
            titleText = 'ゲーム終了';
            titleClass = '';
            console.log('⚠️ デフォルトケース適用 - 予期しない結果:', result);
    }
    
    // モーダル内容を更新
    icon.textContent = iconText;
    title.textContent = titleText;
    title.className = `result-title ${titleClass}`;
    messageElement.textContent = message;
    
    // モーダル表示
    modal.style.display = 'flex';
    console.log('🎭 モーダル表示完了:', { result, iconText, titleText, message });
}

// スラッシュエフェクト表示（実装保留）
function showSlashEffect(target, isEffective = false, attackerElement = null) {
    // スラッシュエフェクトの実装は保留中
    // ダメージエフェクトで十分な視覚的フィードバックを提供
    console.log('⚔️ スラッシュエフェクト（保留中）:', target.name, '効果的:', isEffective);
    return;
    
    /* 実装保留中のコード
    const targetElement = document.querySelector(`[data-card-id="${target.id}"]`);
    if (!targetElement) {
        console.warn('⚠️ 対象カード要素が見つかりません:', target.id);
        return;
    }
    
    const slashElement = document.createElement('div');
    let className = `slash-effect ${isEffective ? 'effective' : ''}`;
    
    if (isEffective && attackerElement) {
        className += ` ${attackerElement}`;
    }
    
    slashElement.className = className;
    
    if (getComputedStyle(targetElement).position === 'static') {
        targetElement.style.position = 'relative';
    }
    targetElement.appendChild(slashElement);
    
    setTimeout(() => {
        if (slashElement && slashElement.parentNode) {
            slashElement.parentNode.removeChild(slashElement);
        }
    }, 600);
    */
}

// ダメージアニメーション表示
function showDamageAnimation(target, damageInfo, attackerElement = null) {
    // 対象カードの要素を取得
    const targetElement = document.querySelector(`[data-card-id="${target.id}"]`);
    if (!targetElement) {
        console.warn('⚠️ 対象カード要素が見つかりません:', target.id);
        return;
    }
    
    // ダメージアニメーション要素を作成
    const damageElement = document.createElement('div');
    let className = `damage-animation ${damageInfo.isEffective ? 'effective' : ''}`;
    
    // 相剋効果がある場合、攻撃側の属性を追加
    if (damageInfo.isEffective && attackerElement) {
        className += ` ${attackerElement}`;
    }
    
    damageElement.className = className;
    damageElement.textContent = `-${damageInfo.damage}`;
    
    // カード要素に追加（相対配置）
    targetElement.style.position = 'relative';
    targetElement.appendChild(damageElement);
    
    console.log('💥 ダメージアニメーション表示:', {
        対象: target.name,
        ダメージ: damageInfo.damage,
        効果的: damageInfo.isEffective,
        攻撃属性: attackerElement
    });
    
    // アニメーション終了後に要素を削除
    setTimeout(() => {
        if (damageElement.parentNode) {
            damageElement.parentNode.removeChild(damageElement);
        }
    }, 1000);
}

// 確実にコスト1が入る手札生成（マリガン自動化）
function generateStartingHand(deck) {
    const cost1Cards = deck.filter(card => card.cost === 1);
    const otherCards = deck.filter(card => card.cost !== 1);
    
    if (cost1Cards.length === 0) {
        console.error('❌ デッキにコスト1カードがありません');
        // フォールバック：通常のランダム手札
        return deck.slice(0, 3);
    }
    
    console.log('🎴 手札生成開始:', {
        デッキサイズ: deck.length,
        コスト1カード: cost1Cards.length + '枚',
        その他カード: otherCards.length + '枚'
    });
    
    // 必ず1枚はコスト1を保証
    const guaranteedCost1 = cost1Cards[Math.floor(Math.random() * cost1Cards.length)];
    const hand = [guaranteedCost1];
    
    // 残り2枚をランダム選択（デッキ全体から、保証したカードを除く）
    const remainingDeck = deck.filter(card => card.id !== guaranteedCost1.id);
    const shuffledRemaining = shuffleArray(remainingDeck);
    
    for (let i = 0; i < 2 && i < shuffledRemaining.length; i++) {
        hand.push(shuffledRemaining[i]);
    }
    
    console.log('✅ 手札生成完了:', hand.map(c => `${c.name}(コスト:${c.cost})`));
    console.log('🎯 コスト1保証:', hand.some(c => c.cost === 1) ? '成功' : '失敗');
    
    return hand;
}

function initializeGame() {
    // SE初期化（ゲーム開始時のみ）
    if (!SoundManager.sounds.summon) {
        SoundManager.init();
    }
    
    // デッキ作成
    const playerDeckBase = shuffleArray(cardData.map(card => createCard(card, true)));
    const enemyDeckBase = shuffleArray(cardData.map(card => createCard(card, false)));
    
    // 初期手札（コスト1保証）
    gameState.playerHand = generateStartingHand(playerDeckBase);
    gameState.enemyHand = generateStartingHand(enemyDeckBase);
    
    // 手札に選ばれたカードをデッキから削除
    gameState.playerDeck = playerDeckBase.filter(card => 
        !gameState.playerHand.some(handCard => handCard.id === card.id)
    );
    gameState.enemyDeck = enemyDeckBase.filter(card => 
        !gameState.enemyHand.some(handCard => handCard.id === card.id)
    );
    
    console.log('🎮 ゲーム初期化完了:', {
        プレイヤー手札: gameState.playerHand.length + '枚',
        プレイヤーデッキ: gameState.playerDeck.length + '枚',
        敵手札: gameState.enemyHand.length + '枚',
        敵デッキ: gameState.enemyDeck.length + '枚'
    });
    
    // ゲーム開始（マリガン不要）
    gameState.phase = 'summon';
    gameState.gameOver = false; // ゲーム終了フラグをリセット
    
    // 🛠️ 新機能プロパティの初期化
    gameState.currentEnemyAttacker = null;
    gameState.simultaneousCombatCards = [];
    gameState.attackMode = false;
    gameState.currentAttacker = null;
    gameState.justStartedAttack = false;
    
    console.log('🔧 新機能プロパティ初期化完了:', {
        currentEnemyAttacker: gameState.currentEnemyAttacker,
        simultaneousCombatCards: gameState.simultaneousCombatCards?.length,
        attackMode: gameState.attackMode
    });
    
    elements.endTurnBtn.disabled = false; // ボタンを有効化
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
    elements.controlPanel.style.display = 'flex';
    
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

// ヘルプイベントリスナー
document.getElementById('help-toggle').addEventListener('click', () => {
    const helpModal = document.getElementById('help-modal');
    // SE再生: ボタン
    SoundManager.play('button');
    helpModal.style.display = 'flex';
});

document.getElementById('help-close').addEventListener('click', () => {
    const helpModal = document.getElementById('help-modal');
    // SE再生: ボタン
    SoundManager.play('button');
    helpModal.style.display = 'none';
});

// ヘルプモーダルの背景クリックで閉じる
document.getElementById('help-modal').addEventListener('click', (e) => {
    if (e.target.id === 'help-modal') {
        const helpModal = document.getElementById('help-modal');
        helpModal.style.display = 'none';
    }
});

// 🎭 勝敗結果モーダルイベントリスナー
document.getElementById('result-restart-btn').addEventListener('click', () => {
    console.log('🔄 結果モーダルからゲーム再開');
    SoundManager.play('button');
    
    // モーダルを閉じる
    document.getElementById('game-result-modal').style.display = 'none';
    
    // ゲーム状態をリセット
    gameState = {
        phase: 'draw',
        turn: 1,
        playerPP: 1,
        maxPP: 1,
        enemyPP: 1,
        gameOver: false,
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
        currentEnemyAttacker: null,
        simultaneousCombatCards: [],
        battleQueue: [],
        turnOrder: [],
        messageHistory: []
    };
    
    // ゲーム再開
    initializeGame();
});

document.getElementById('result-close-btn').addEventListener('click', () => {
    console.log('❌ 結果モーダルを閉じる');
    SoundManager.play('button');
    document.getElementById('game-result-modal').style.display = 'none';
});

// 結果モーダルの背景クリックで閉じる
document.getElementById('game-result-modal').addEventListener('click', (e) => {
    if (e.target.id === 'game-result-modal' || e.target.classList.contains('result-overlay')) {
        console.log('📱 背景クリックで結果モーダルを閉じる');
        document.getElementById('game-result-modal').style.display = 'none';
    }
});

// ヘルプタブ切り替え機能 🌸
function initializeHelpTabs() {
    console.log('🎯 ヘルプタブシステム初期化');
    
    const tabButtons = document.querySelectorAll('.help-tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    // タブボタンのクリックイベント
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // SE再生: ボタン
            SoundManager.play('button');
            
            const targetTab = button.getAttribute('data-tab');
            console.log('🎯 タブ切り替え:', targetTab);
            
            // 全てのタブボタンからactiveクラスを削除
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 全てのタブパネルからactiveクラスを削除
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // クリックされたタブボタンをアクティブに
            button.classList.add('active');
            // 対応するタブパネルをアクティブに
            const targetPanel = document.getElementById(targetTab + '-tab');
            if (targetPanel) {
                targetPanel.classList.add('active');
                console.log('✅ タブ表示:', targetTab);
            } else {
                console.warn('⚠️ タブパネル未発見:', targetTab + '-tab');
            }
        });
    });
    
    console.log('✅ ヘルプタブシステム初期化完了');
}

// ゲーム開始
initializeGame();

// ヘルプタブシステム初期化（DOM読み込み後）
document.addEventListener('DOMContentLoaded', () => {
    initializeHelpTabs();
});