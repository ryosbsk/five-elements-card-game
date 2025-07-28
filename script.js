// 五行カードバトルゲーム

/**
 * @typedef {Object} Card
 * @property {number} id - カードID
 * @property {string} name - カード名
 * @property {string} element - 属性（木火土金水）
 * @property {number} cost - コスト
 * @property {number} hp - 体力
 * @property {number} attack - 攻撃力
 * @property {number} speed - スピード
 * @property {boolean} isPlayer - プレイヤーカードか
 * @property {boolean} hasActed - 行動済みか
 */

/**
 * @typedef {Object} GameState
 * @property {Card[]} playerField - プレイヤーフィールド
 * @property {Card[]} enemyField - 敵フィールド
 * @property {Card[]} playerHand - プレイヤー手札
 * @property {Card[]} enemyHand - 敵手札
 * @property {number} playerPP - プレイヤーPP
 * @property {number} enemyPP - 敵PP
 * @property {number} turn - ターン数
 * @property {string} phase - フェーズ（summon/battle）
 * @property {number} defeatedCost - 撃破済みコスト
 * @property {Array<{text: string, timestamp: number}>} messageHistory - メッセージ履歴
 */

// SE・BGM管理システム 🔊
/** @type {Object} */
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
    
    // 🚀 非同期初期化メソッド（Promise対応）
    initAsync: function() {
        return new Promise((resolve, reject) => {
            console.log('🔊 SoundManager非同期初期化開始');
            
            try {
                this.init(); // 既存の init() 実行
                
                // 初期化完了確認（少し待機）
                setTimeout(() => {
                    const isInitialized = !!this.sounds.button && !!this.bgm;
                    
                    if (isInitialized) {
                        console.log('✅ SoundManager非同期初期化成功:', {
                            '登録SE数': Object.keys(this.sounds).length,
                            'BGM存在': !!this.bgm,
                            'button SE': !!this.sounds.button
                        });
                        resolve(true);
                    } else {
                        console.warn('⚠️ SoundManager初期化不完全');
                        resolve(false); // reject ではなく resolve で継続
                    }
                }, 150); // 少し長めの待機時間
                
            } catch (error) {
                console.error('❌ SoundManager初期化エラー:', error);
                resolve(false); // reject ではなく resolve で継続
            }
        });
    },
    
    // SE再生（詳細トレーシング付き）
    play: function(soundName) {
        if (!this.seEnabled) {
            console.log('🔇 SE無効のため再生スキップ:', soundName);
            return;
        }
        
        // 🔍 詳細ログ: 登録済みSE一覧
        console.log('🔍 SE再生要求:', {
            '要求SE': soundName,
            '登録済みSE一覧': Object.keys(this.sounds),
            'SE有効状態': this.seEnabled,
            '対象SE存在確認': soundName in this.sounds
        });
        
        const sound = this.sounds[soundName];
        if (sound) {
            try {
                // 再生位置をリセットして再生
                sound.currentTime = 0;
                const playPromise = sound.play();
                console.log('🔊 SE再生開始:', soundName);
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('✅ SE再生成功:', soundName);
                    }).catch(error => {
                        console.warn('⚠️ SE再生失敗:', soundName, error);
                    });
                }
            } catch (error) {
                console.warn('⚠️ SE再生エラー:', soundName, error);
            }
        } else {
            console.warn('❌ SE未登録:', soundName, {
                '利用可能SE': Object.keys(this.sounds),
                'sounds_object': this.sounds
            });
        }
    },
    
    // BGM音量設定（Alpine.js連携用）
    setBGMVolume: function(volume) {
        const volumeValue = volume / 100; // 0-100 を 0-1 に変換
        if (this.bgm) {
            this.bgm.volume = volumeValue;
            console.log('🎵 BGM音量設定:', `${volume}% (${volumeValue})`);
        } else {
            console.warn('⚠️ BGM要素が存在しません');
        }
    },
    
    // SE音量設定（Alpine.js連携用）
    setSEVolume: function(volume) {
        const volumeValue = volume / 100; // 0-100 を 0-1 に変換
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = volumeValue;
            }
        });
        console.log('🔊 SE音量設定:', `${volume}% (${volumeValue}) - 対象SE数: ${Object.keys(this.sounds).length}`);
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
    
    // 重複したメソッドを削除（上部の新しいバージョンを使用）
    
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
    { name: "ヒノコ", element: "火", hp: 20, attack: 16, speed: 4, cost: 1, image: "assets/images/cards/fire_01.png" },
    { name: "ドネズミ", element: "土", hp: 25, attack: 14, speed: 1, cost: 1, image: "assets/images/cards/earth_01.png" },
    { name: "きんぴよ", element: "金", hp: 23, attack: 14, speed: 3, cost: 1, image: "assets/images/cards/metal_01.png" },
    { name: "しずく", element: "水", hp: 24, attack: 11, speed: 5, cost: 1, image: "assets/images/cards/water_01.png" },
    { name: "苔兜", element: "木", hp: 28, attack: 10, speed: 2, cost: 1, image: "assets/images/cards/wood_01.png" },
    
    // コスト2カード  
    { name: "やけとり", element: "火", hp: 22, attack: 18, speed: 6, cost: 2, image: "assets/images/cards/fire_02.png" },
    { name: "黒羊", element: "土", hp: 27, attack: 16, speed: 3, cost: 2, image: "assets/images/cards/earth_02.png" },
    { name: "黄金豚", element: "金", hp: 25, attack: 16, speed: 5, cost: 2, image: "assets/images/cards/metal_02.png" },
    { name: "あわあわ", element: "水", hp: 26, attack: 13, speed: 7, cost: 2, image: "assets/images/cards/water_02.png" },
    { name: "マッチャ", element: "木", hp: 30, attack: 12, speed: 4, cost: 2, image: "assets/images/cards/wood_02.png" }
];

// ゲーム状態
/** @type {GameState} */
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

// DOM要素（詳細トレーシング付き）
console.log('🔍 DOM要素取得開始...');
const elements = {
    phase: document.getElementById('current-phase'),
    turn: document.getElementById('turn-counter'),
    pp: document.getElementById('pp-counter'),
    victory: document.getElementById('victory-counter'),
    enemyHandCount: document.getElementById('enemy-hand-count'),
    enemyPP: document.getElementById('enemy-pp'),
    enemyVictory: document.getElementById('enemy-victory-counter'),
    message: document.getElementById('game-message'), // 旧要素（後方互換用）
    messageFeed: document.getElementById('message-feed'),
    playerHand: document.getElementById('player-hand'),
    summonToBattleBtn: document.getElementById('summon-to-battle-btn'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    restartGameBtn: document.getElementById('restart-game-btn'),
    skipActionBtn: document.getElementById('skip-action-btn'),
    waitingBtn: document.getElementById('waiting-btn'),
    gameBackground: document.getElementById('game-background'),
    // 降参関連要素
    surrenderModal: document.getElementById('surrender-modal'),
    surrenderConfirmBtn: document.getElementById('surrender-confirm-btn'),
    surrenderCancelBtn: document.getElementById('surrender-cancel-btn'),
    // ハンバーガーメニュー関連
    hamburgerBtn: document.getElementById('hamburger-btn'),
    hamburgerMenu: document.getElementById('hamburger-menu'),
    surrenderMenuBtn: document.getElementById('surrender-menu-btn'),
    // スタート画面要素
    startScreen: document.getElementById('start-screen'),
    startBtn: document.getElementById('start-game-btn'),
    gameContainer: document.getElementById('game-container'),
    // 音響コントロール要素
    audioToggle: document.getElementById('audio-toggle'),
    audioPanel: document.getElementById('audio-panel')
    // audioClose, bgmToggle, seToggle, bgmVolume, seVolume は Alpine.js で処理
};

// 🔍 DOM要素取得状況の詳細確認
console.log('🔍 DOM要素取得結果:', {
    'endTurnBtn': !!elements.endTurnBtn ? '✅ 取得成功' : '❌ 取得失敗',
    'skipActionBtn': !!elements.skipActionBtn ? '✅ 取得成功' : '❌ 取得失敗', 
    'hamburgerBtn': !!elements.hamburgerBtn ? '✅ 取得成功' : '❌ 取得失敗',
    'hamburgerMenu': !!elements.hamburgerMenu ? '✅ 取得成功' : '❌ 取得失敗',
    'audioToggle': !!elements.audioToggle ? '✅ 取得成功' : '❌ 取得失敗',
    'audioPanel': !!elements.audioPanel ? '✅ 取得成功' : '❌ 取得失敗'
});

// 🔍 重要ボタンの詳細情報
if (elements.endTurnBtn) {
    console.log('🎮 endTurnBtn詳細:', {
        'id': elements.endTurnBtn.id,
        'className': elements.endTurnBtn.className,
        'textContent': elements.endTurnBtn.textContent,
        'style.display': elements.endTurnBtn.style.display,
        'disabled': elements.endTurnBtn.disabled
    });
} else {
    // 代替検索
    const endTurnSearch = document.querySelector('#end-turn-btn, [id="end-turn-btn"], button[class*="end-turn"]');
    console.log('🔍 endTurnBtn代替検索結果:', {
        '直接querySelector結果': !!endTurnSearch,
        '要素詳細': endTurnSearch ? {
            'tagName': endTurnSearch.tagName,
            'id': endTurnSearch.id,
            'className': endTurnSearch.className
        } : 'なし'
    });
}

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
    
    // 五行属性に応じた色彩システム
    const elementColors = {
        '木': 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200',
        '火': 'border-red-400 bg-gradient-to-br from-red-50 to-rose-100 hover:from-red-100 hover:to-rose-200',
        '土': 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-100 hover:from-amber-100 hover:to-yellow-200',
        '金': 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-100 hover:from-yellow-100 hover:to-amber-200',
        '水': 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-100 hover:from-blue-100 hover:to-cyan-200'
    };
    
    const elementColorClass = elementColors[card.element] || 'border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100';
    
    cardElement.className = `card ${card.element} ${elementColorClass} rounded-xl shadow-lg hover:shadow-2xl border-2 transform hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden`;
    cardElement.dataset.cardId = card.id;
    
    cardElement.innerHTML = `
        <div class="card-content-vertical" ${card.image ? `style="background-image: url('${card.image}')"` : ''}>
            <!-- 上部：コスト＋カード名（中央配置） -->
            <div class="card-header-overlay">
                <span class="element-cost-overlay">
                    <span class="element-icon">${elementIcons[card.element]}</span>
                    <span class="cost-number">${card.cost}</span>
                </span>
                <span class="card-name">${card.name.length > 4 ? card.name.substring(0, 4) : card.name}</span>
            </div>
            
            <!-- 下部：ステータス表示（中央配置） -->
            <div class="card-stats-overlay-bottom">
                <div class="stat-overlay">
                    <span class="stat-icon">❤️</span>
                    <span class="stat-number">${card.hp}</span>
                </div>
                <div class="stat-overlay">
                    <span class="stat-icon">🗡️</span>
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
    
    // 🎮 統一ボタン管理システム
    updateButtonStates();
    
    // 🔍 フェーズスキップ検出機能
    detectPhaseSkip();
}

// 🎮 統一ボタン状態管理システム
function updateButtonStates() {
    if (!elements.endTurnBtn || !elements.skipActionBtn) {
        console.warn('⚠️ ボタン要素が見つかりません');
        return;
    }
    
    console.log('🎮 ボタン状態更新:', {
        'フェーズ': gameState.phase,
        'ゲーム終了': gameState.gameOver || false,
        'ボタンテキスト': elements.endTurnBtn.textContent
    });
    
    // 全ボタン非表示にリセット
    elements.summonToBattleBtn.style.display = 'none';
    elements.endTurnBtn.style.display = 'none';
    elements.restartGameBtn.style.display = 'none';
    elements.skipActionBtn.style.display = 'none';
    elements.waitingBtn.style.display = 'none';
    
    // ゲーム終了時の処理
    if (gameState.gameOver) {
        console.log('🎮 ゲーム終了状態 - ゲーム再開ボタンを表示');
        elements.restartGameBtn.style.display = 'inline-block';
        return;
    }
    
    switch (gameState.phase) {
        case 'summon':
            elements.summonToBattleBtn.style.display = 'inline-block';
            break;
            
        case 'battle':
            // 戦闘フェーズ中の適切なボタン表示
            const currentTurnCard = gameState.turnOrder?.find(card => !card.hasActed);
            if (currentTurnCard && currentTurnCard.isPlayer) {
                elements.skipActionBtn.style.display = 'inline-block';
            } else if (currentTurnCard && !currentTurnCard.isPlayer) {
                // 敵のターン中は待機ボタンを表示
                elements.waitingBtn.style.display = 'inline-block';
            } else {
                // 全員行動完了時はターン終了ボタン
                elements.endTurnBtn.style.display = 'inline-block';
            }
            break;
            
        default:
            elements.endTurnBtn.style.display = 'inline-block';
            elements.endTurnBtn.disabled = true;
            break;
    }
    
    console.log('✅ ボタン状態更新完了:', {
        'endTurnBtn.textContent': elements.endTurnBtn.textContent,
        'endTurnBtn.disabled': elements.endTurnBtn.disabled,
        'skipActionBtn.display': elements.skipActionBtn.style.display
    });
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
            
            // 🔒 戦闘フェーズでの厳密な攻撃選択制御
            if (gameState.phase === 'battle' && !gameState.playerField[i].hasActed) {
                // 現在の行動順序をチェック
                const currentTurnCard = gameState.turnOrder.find(card => !card.hasActed);
                
                // 🚫 選択可能性の厳密な条件チェック
                const isCurrentPlayerTurn = currentTurnCard && currentTurnCard.id === gameState.playerField[i].id;
                const isNotInAttackMode = !gameState.attackMode;
                const isNotProcessingAction = !gameState.isProcessingAction; // 処理中フラグ（必要に応じて追加）
                
                console.log('🔍 カード選択可能性チェック:', {
                    'カード名': gameState.playerField[i].name,
                    '現在のターン': isCurrentPlayerTurn,
                    '攻撃モード外': isNotInAttackMode,
                    '選択可能': isCurrentPlayerTurn && isNotInAttackMode
                });
                
                if (isCurrentPlayerTurn && isNotInAttackMode) {
                    cardElement.addEventListener('click', (event) => {
                        // 🔒 実行時の再確認（ダブルクリック防止）
                        if (gameState.gameOver) {
                            console.log('🚫 ゲーム終了済み - 攻撃選択無効');
                            return;
                        }
                        if (gameState.attackMode) {
                            console.log('🚫 攻撃モード中 - 重複選択無効');
                            return;
                        }
                        if (gameState.playerField[i].hasActed) {
                            console.log('🚫 行動済み - 攻撃選択無効');
                            return;
                        }
                        
                        console.log('🎯 プレイヤーカードクリック:', gameState.playerField[i].name, 'で攻撃開始準備！');
                        event.stopPropagation(); // 親要素への伝播を防止
                        
                        console.log('⚔️ 攻撃モード開始:', gameState.playerField[i].name, '→ 敵を選択してください');
                        startAttack(gameState.playerField[i]);
                    });
                    cardElement.classList.add('selectable');
                    cardElement.classList.add('current-turn');
                } else {
                    // 🔒 選択不可状態を明示
                    cardElement.classList.remove('selectable');
                    cardElement.classList.remove('current-turn');
                    console.log('🔒 カード選択不可:', gameState.playerField[i].name, '（条件未満足）');
                }
            } else {
                // 🔒 戦闘フェーズ外または行動済みカードは選択不可
                cardElement.classList.remove('selectable');
                cardElement.classList.remove('current-turn');
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
    // 🔍 重複バグ解析用ログシステム
    console.log('📝 showMessage呼び出し:', {
        'メッセージ': message,
        '呼び出し時刻': new Date().toLocaleTimeString(),
        '現在のメッセージ履歴数': gameState.messageHistory.length,
        '直前のメッセージ': gameState.messageHistory[gameState.messageHistory.length - 1]?.text || 'なし'
    });
    
    // 🚨 重複検出ログ
    const isDuplicate = gameState.messageHistory.length > 0 && 
                       gameState.messageHistory[gameState.messageHistory.length - 1].text === message;
    if (isDuplicate) {
        console.warn('⚠️ 重複メッセージ検出!', {
            '重複メッセージ': message,
            'スタックトレース': new Error().stack
        });
    }
    
    // 📊 呼び出し元追跡（スタックトレース）
    const stack = new Error().stack.split('\n');
    console.log('🎯 showMessage呼び出し元:', {
        '直接呼び出し元': stack[2]?.trim() || '不明',
        '関数チェーン': stack.slice(1, 4).map(line => line.trim())
    });
    
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
    console.log('🔍 メッセージ表示更新開始');
    const messageFeed = elements.messageFeed;
    
    if (!messageFeed) {
        console.warn('❌ messageFeed element not found');
        return;
    }
    
    console.log('📊 メッセージフィード状態:', {
        '要素ID': messageFeed.id,
        'クラス': messageFeed.className,
        '初期高さ': messageFeed.scrollHeight,
        '初期スクロール位置': messageFeed.scrollTop,
        '表示エリア高さ': messageFeed.clientHeight
    });
    
    // フィードをクリア
    messageFeed.innerHTML = '';
    
    // 五行属性メッセージ色彩マッピング
    const elementMessageColors = {
        '木': 'border-l-4 border-emerald-400 bg-emerald-50 text-emerald-800',
        '火': 'border-l-4 border-red-400 bg-red-50 text-red-800',
        '土': 'border-l-4 border-amber-400 bg-amber-50 text-amber-800',
        '金': 'border-l-4 border-yellow-400 bg-yellow-50 text-yellow-800',
        '水': 'border-l-4 border-blue-400 bg-blue-50 text-blue-800'
    };
    
    // 最新15件を表示
    const recentMessages = gameState.messageHistory.slice(-15);
    recentMessages.forEach((msg, index) => {
        const msgElement = document.createElement('div');
        
        // 基本スタイル
        let baseClass = 'px-3 py-2 mb-2 rounded-lg text-xs transition-all duration-300';
        
        // 五行属性効果メッセージの色彩適用
        let elementColor = '';
        for (const [element, color] of Object.entries(elementMessageColors)) {
            if (msg.text.includes(`${element}は`) || msg.text.includes(`${element}が`)) {
                elementColor = color;
                break;
            }
        }
        
        // メッセージタイプ別色彩適用
        if (elementColor) {
            // 属性効果メッセージ
            msgElement.className = `${baseClass} ${elementColor} font-semibold`;
        } else if (msg.text.includes('敵の') || msg.text.includes('敵が') || msg.text.includes('攻撃')) {
            // 戦闘メッセージ
            msgElement.className = `${baseClass} border-l-4 border-red-400 bg-red-50 text-red-700`;
        } else if (msg.text.includes('ターン') || msg.text.includes('フェーズ')) {
            // システムメッセージ
            msgElement.className = `${baseClass} border-l-4 border-gray-400 bg-gray-50 text-gray-700`;
        } else if (msg.text.includes('勝利') || msg.text.includes('敗北')) {
            // 結果メッセージ
            msgElement.className = `${baseClass} border-l-4 border-purple-400 bg-purple-50 text-purple-700 font-bold`;
        } else {
            // 一般メッセージ
            msgElement.className = `${baseClass} border-l-4 border-blue-400 bg-blue-50 text-blue-700`;
        }
        
        // 最新メッセージはハイライト
        if (index === recentMessages.length - 1) {
            msgElement.classList.add('ring-2', 'ring-yellow-300', 'shadow-lg');
        }
        
        msgElement.textContent = msg.text;
        messageFeed.appendChild(msgElement);
    });
    
    // 📍 詳細スクロールデバッグログ追加
    console.log('📍 スクロール開始:', {
        '要素存在': !!messageFeed,
        'メッセージ数': recentMessages.length,
        '現在の高さ': messageFeed.scrollHeight,
        '現在のスクロール位置': messageFeed.scrollTop,
        '表示エリア高さ': messageFeed.clientHeight
    });
    
    // 最下部にスクロール（強制再描画付き）
    setTimeout(() => {
        const beforeHeight = messageFeed.scrollHeight;
        const beforeScroll = messageFeed.scrollTop;
        
        messageFeed.scrollTop = messageFeed.scrollHeight;
        console.log('📍 スクロール実行1:', {
            '実行前高さ': beforeHeight,
            '実行前位置': beforeScroll,
            '実行後高さ': messageFeed.scrollHeight,
            '実行後位置': messageFeed.scrollTop
        });
        
        // 強制的に再描画してスクロール確実実行
        messageFeed.offsetHeight; // トリガー用
        messageFeed.scrollTop = messageFeed.scrollHeight;
        console.log('📍 スクロール実行2（再描画後）:', {
            '高さ': messageFeed.scrollHeight,
            '位置': messageFeed.scrollTop,
            '最下部到達': messageFeed.scrollTop >= messageFeed.scrollHeight - messageFeed.clientHeight
        });
        
        // さらに確実にするため再実行
        requestAnimationFrame(() => {
            messageFeed.scrollTop = messageFeed.scrollHeight;
            const isAtBottom = messageFeed.scrollTop >= messageFeed.scrollHeight - messageFeed.clientHeight;
            console.log('📍 スクロール実行3（requestAnimationFrame）:', {
                '高さ': messageFeed.scrollHeight,
                '位置': messageFeed.scrollTop,
                '最下部到達': isAtBottom,
                '到達判定差分': messageFeed.scrollHeight - messageFeed.clientHeight - messageFeed.scrollTop
            });
            
            // 💡 デバッグガイダンス
            if (!isAtBottom) {
                console.warn('⚠️ スクロールが最下部に到達していません。以下を確認してください:');
                console.log('🔍 確認項目:', {
                    '1. CSS overflow設定': 'message-feedにoverflow-y: autoが設定されているか',
                    '2. 高さ制限': 'max-heightまたはheightが適切に設定されているか', 
                    '3. flexbox影響': '親要素のflex設定がスクロールに影響していないか',
                    '4. タイミング': 'DOM更新とスクロール実行のタイミングが適切か'
                });
            } else {
                console.log('✅ スクロールが正常に最下部まで到達しました');
            }
        });
    }, 50);
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

// 旧予測ダメージ表示機能削除済み - 統合機能により代替

// 統合機能の予測ダメージ表示を削除
function hideDamagePreview() {
    // 統合機能のカード内要素を削除
    document.querySelectorAll('.damage-preview-integrated').forEach(element => {
        element.remove();
    });
    // ゲームコンテナ内のオーバーレイ要素も削除
    document.querySelectorAll('.damage-preview-overlay').forEach(element => {
        element.remove();
    });
    console.log('🧹 統合機能予測ダメージ全削除');
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
        
        // 相剋効果に応じたメッセージ表示（復元版）
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
    
    // 🎬 Stage 1: 敵カードの攻撃準備アニメーション表示
    console.log('🎭 敵攻撃アニメーション開始:', enemyCard.name);
    gameState.currentEnemyAttacker = enemyCard; // 攻撃中の敵カードを記録
    // メッセージは表示せず、アニメーションのみ実行
    updateDisplay(); // 敵カードにenemy-attackingクラスを追加するため
    
    // 800ms後に対象選択と攻撃実行
    setTimeout(() => {
        // 🎬 Stage 2: 攻撃対象選択と実行
        enemySelectAndShowTarget(enemyCard, playerCards);
    }, 800);
}

// 🎬 Stage 2: 敵の攻撃対象選択と表示
function enemySelectAndShowTarget(enemyCard, playerCards) {
    let target;
    const randomValue = Math.random();
    
    console.log('🧠 敵AI思考プロセス:', {
        攻撃者: `${enemyCard.name}(攻撃力:${enemyCard.attack}, 属性:${enemyCard.element})`,
        選択可能対象: playerCards.map(c => `${c.name}(HP:${c.hp}, 属性:${c.element})`),
        判定用乱数値: randomValue.toFixed(3),
        戦略閾値: '0.900(最低HP狙い)'
    });
    
    // 90%の確率で最もHPが低いカードを狙う
    if (randomValue < 0.9) {
        target = playerCards.reduce((lowest, card) => 
            card.hp < lowest.hp ? card : lowest
        );
        console.log('🤖 AI戦略: 最低HP狙い →', target.name, '(HP:', target.hp, ')');
        
        // 相克ダメージ計算を予想表示
        const damageInfo = calculateElementalDamage(enemyCard, target);
        console.log('💫 予想ダメージ:', {
            基本ダメージ: enemyCard.attack,
            相克補正: damageInfo.isEffective ? `+${damageInfo.bonus}` : 'なし',
            最終ダメージ: damageInfo.damage,
            撃破予想: target.hp <= damageInfo.damage ? '✅撃破' : '❌生存'
        });
    } else {
        target = playerCards[Math.floor(Math.random() * playerCards.length)];
        console.log('🤖 AI戦略: ランダム選択 →', target.name, '(HP:', target.hp, ')');
    }
    
    // 短時間の対象表示後に攻撃実行
    showMessage(`🎯 敵の${enemyCard.name}が${target.name}を狙います！`);
    
    // 400ms後に実際の攻撃実行  
    setTimeout(() => {
        executeEnemyAttack(enemyCard, target);
    }, 400);
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
    
    // 相剋効果に応じたメッセージ表示（復元版）
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
        
        // 五行属性色彩マッピング（ターン順表示用）
        const elementTurnColors = {
            '木': 'border-emerald-400 text-emerald-700 bg-emerald-50',
            '火': 'border-red-400 text-red-700 bg-red-50',
            '土': 'border-amber-400 text-amber-700 bg-amber-50',
            '金': 'border-yellow-400 text-yellow-700 bg-yellow-50',
            '水': 'border-blue-400 text-blue-700 bg-blue-50'
        };
        
        // 全カードを表示
        gameState.turnOrder.forEach((card, globalIndex) => {
            const cardElement = document.createElement('div');
            
            // 五行テーマ色彩を適用
            const elementColor = elementTurnColors[card.element] || 'border-gray-400 text-gray-700 bg-gray-50';
            
            // 敵味方の明確な識別デザイン
            const playerType = card.isPlayer 
                ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-400' // プレイヤー：青系統で統一
                : 'ring-2 ring-red-500 bg-red-50 border-red-400';   // 敵：赤系統で統一
            
            cardElement.className = `turn-order-mini inline-flex items-center gap-1 px-2 py-1 rounded-lg border-2 ${playerType} transition-all duration-300 text-xs font-semibold shadow-sm mb-1`;
            
            // 行動済みカードはグレーアウトクラスを追加
            if (card.hasActed) {
                cardElement.classList.add('opacity-40', 'grayscale');
            }
            
            // 属性アイコン・カード名・速度をコンパクト表示
            const elementIcon = elementIcons[card.element];
            
            cardElement.innerHTML = `
                <span class="text-lg">${elementIcon}</span>
                <span class="font-bold">${card.name.length > 4 ? card.name.substring(0, 4) : card.name}</span>
                <div class="flex items-center gap-1 ml-1 px-1 py-0.5 bg-white bg-opacity-70 rounded-md">
                    <span class="text-yellow-600">⚡</span>
                    <span class="text-xs font-bold">${card.speed}</span>
                </div>
            `;
            
            // 現在行動中のカードをハイライト（未行動の最初のカード）
            const unactedIndex = unactedCards.findIndex(unactedCard => unactedCard === card);
            if (unactedIndex === 0) {
                cardElement.classList.add('ring-4', 'ring-yellow-400', 'bg-opacity-80', 'shadow-lg', 'scale-105');
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
    
    console.log('🎯 行動順決定開始:', {
        プレイヤーカード: gameState.playerField.filter(c => c !== null).map(c => `${c.name}(スピード:${c.speed})`),
        敵カード: gameState.enemyField.filter(c => c !== null).map(c => `${c.name}(スピード:${c.speed})`),
        総参加カード数: allCards.length
    });
    
    gameState.turnOrder = allCards.sort((a, b) => b.speed - a.speed);
    
    console.log('⚡ 行動順確定:', gameState.turnOrder.map((c, i) => 
        `${i + 1}番目: ${c.name}(スピード:${c.speed}, ${c.isPlayer ? 'プレイヤー' : '敵'})`
    ));
    
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

// 🔍 ゲーム初期化重複検出・防止システム
let gameInitializationCount = 0;
let gameInitializationTimestamps = [];
let isGameInitializing = false; // 🔒 初期化中フラグ
let lastInitializationTime = 0;

function initializeGame() {
    const currentTime = Date.now();
    
    // 🚨 重複初期化防止システム
    if (isGameInitializing) {
        console.warn('⚠️ 初期化中につき処理をスキップします:', {
            '現在実行中': true,
            '要求発生時刻': new Date().toLocaleTimeString()
        });
        return;
    }
    
    // 短期間内の重複実行防止（1秒以内）
    if (currentTime - lastInitializationTime < 1000) {
        console.warn('⚠️ 短期間内重複実行のためスキップします:', {
            '前回からの経過時間': `${currentTime - lastInitializationTime}ms`,
            '最小間隔': '1000ms'
        });
        return;
    }
    
    // 🔒 初期化開始フラグ設定
    isGameInitializing = true;
    lastInitializationTime = currentTime;
    
    // 🚨 重複初期化検出ログ
    gameInitializationCount++;
    gameInitializationTimestamps.push(currentTime);
    
    console.log('🎮 ゲーム初期化実行:', {
        '実行回数': gameInitializationCount,
        '現在時刻': new Date().toLocaleTimeString(),
        '前回からの経過時間': gameInitializationTimestamps.length > 1 ? 
            `${gameInitializationTimestamps[gameInitializationTimestamps.length - 1] - gameInitializationTimestamps[gameInitializationTimestamps.length - 2]}ms` : '初回',
        'スタックトレース': new Error().stack.split('\n').slice(1, 4).map(line => line.trim())
    });
    
    // 🚨 短時間での重複実行を警告
    if (gameInitializationTimestamps.length > 1) {
        const timeDiff = gameInitializationTimestamps[gameInitializationTimestamps.length - 1] - 
                        gameInitializationTimestamps[gameInitializationTimestamps.length - 2];
        if (timeDiff < 1000) { // 1秒以内の重複
            console.warn('⚠️ ゲーム初期化の短時間重複実行検出!', {
                '間隔': `${timeDiff}ms`,
                '重複可能性': 'HIGH'
            });
        }
    }
    
    // SE初期化（ゲーム開始時のみ）
    console.log('🔍 SoundManager初期化確認:', {
        'summon登録済み': !!SoundManager.sounds.summon,
        '登録済みSE数': Object.keys(SoundManager.sounds).length,
        '初期化実行判定': !SoundManager.sounds.summon
    });
    
    if (!SoundManager.sounds.summon) {
        console.log('🔊 SoundManager初期化を実行します...');
        SoundManager.init();
        
        // 初期化後の確認
        setTimeout(() => {
            console.log('🔍 SoundManager初期化完了確認:', {
                '登録SE一覧': Object.keys(SoundManager.sounds),
                'button SE確認': !!SoundManager.sounds.button,
                'sounds object': SoundManager.sounds
            });
        }, 100);
    } else {
        console.log('✅ SoundManager既に初期化済み');
    }
    
    // 🔄 ゲーム再開: フィールドリセット前の状況記録
    console.log('🔄 ゲーム再開: フィールドリセット前', {
        プレイヤーフィールド: gameState.playerField ? gameState.playerField.map((c, i) => c ? `${i}:${c.name}` : `${i}:空`) : '未初期化',
        敵フィールド: gameState.enemyField ? gameState.enemyField.map((c, i) => c ? `${i}:${c.name}` : `${i}:空`) : '未初期化',
        プレイヤー撃破ポイント: gameState.defeatedCost || 0,
        敵撃破ポイント: gameState.enemyDefeatedCost || 0,
        現在ターン: gameState.turn || 0
    });

    // 🛠️ フィールドと撃破ポイントの完全リセット
    gameState.playerField = [null, null, null];  // プレイヤーフィールドクリア
    gameState.enemyField = [null, null, null];   // 敵フィールドクリア
    gameState.defeatedCost = 0;                  // プレイヤー撃破ポイントリセット
    gameState.enemyDefeatedCost = 0;             // 敵撃破ポイントリセット
    gameState.turn = 1;                          // ターン数リセット
    gameState.playerPP = 1;                      // プレイヤーPPリセット
    gameState.enemyPP = 1;                       // 敵PPリセット
    
    // 🧹 DOM要素の完全クリア
    console.log('🧹 DOM要素クリア実行');
    for (let i = 0; i < 3; i++) {
        const playerSlot = document.getElementById(`player-slot-${i}`);
        const enemySlot = document.getElementById(`enemy-slot-${i}`);
        
        if (playerSlot) {
            playerSlot.innerHTML = '<div class="empty-slot text-gray-400 text-sm">空</div>';
            playerSlot.className = 'card-slot border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 bg-opacity-50 flex items-center justify-center hover:bg-gray-100 hover:border-gray-400 transition-all duration-300';
        }
        if (enemySlot) {
            enemySlot.innerHTML = '<div class="empty-slot text-gray-400 text-sm">空</div>';
            enemySlot.className = 'card-slot border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 bg-opacity-50 flex items-center justify-center hover:bg-gray-100 hover:border-gray-400 transition-all duration-300';
        }
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
    
    // ✅ ゲーム再開: フィールドリセット後の確認
    console.log('✅ ゲーム再開: フィールドリセット後', {
        プレイヤーフィールド: gameState.playerField.map((c, i) => c ? `${i}:${c.name}` : `${i}:空`),
        敵フィールド: gameState.enemyField.map((c, i) => c ? `${i}:${c.name}` : `${i}:空`),
        プレイヤー撃破ポイント: gameState.defeatedCost,
        敵撃破ポイント: gameState.enemyDefeatedCost,
        現在ターン: gameState.turn,
        プレイヤーPP: gameState.playerPP,
        敵PP: gameState.enemyPP
    });

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
    
    // 🔄 updateDisplay後のフィールド表示確認
    setTimeout(() => {
        console.log('🔍 updateDisplay実行後フィールド表示状況:', {
            'プレイヤースロット0': document.getElementById('player-slot-0')?.innerHTML?.includes('empty-slot') ? '空表示' : 'カード表示',
            'プレイヤースロット1': document.getElementById('player-slot-1')?.innerHTML?.includes('empty-slot') ? '空表示' : 'カード表示', 
            'プレイヤースロット2': document.getElementById('player-slot-2')?.innerHTML?.includes('empty-slot') ? '空表示' : 'カード表示',
            '敵スロット0': document.getElementById('enemy-slot-0')?.innerHTML?.includes('empty-slot') ? '空表示' : 'カード表示',
            '敵スロット1': document.getElementById('enemy-slot-1')?.innerHTML?.includes('empty-slot') ? '空表示' : 'カード表示',
            '敵スロット2': document.getElementById('enemy-slot-2')?.innerHTML?.includes('empty-slot') ? '空表示' : 'カード表示'
        });
    }, 100);
    
    // 🔓 初期化完了フラグリセット
    isGameInitializing = false;
    console.log('✅ ゲーム初期化完了 - フラグリセット完了');
    
    // BGM再生は最初のユーザー操作で開始
}

// スタート画面のイベントリスナーは統合初期化システムに移動済み ✅

// 音響コントロールのイベントリスナー（重複削除済み - 強化版を下部で使用）

// audioClose要素は存在しないため削除済み（Alpine.jsで処理）

// BGM・SE切り替えは下部で詳細実装済み

// bgmVolume要素は存在しないため削除済み（Alpine.jsで処理）

// seVolume要素は存在しないため削除済み（Alpine.jsで処理）

// 戦闘フェーズ移行ボタンのイベントリスナー
if (elements.summonToBattleBtn) {
    elements.summonToBattleBtn.addEventListener('click', () => {
        console.log('⚔️ 戦闘フェーズへボタンクリック');
        SoundManager.play('button');
        if (gameState.phase === 'summon') {
            nextPhase();
        }
    });
} else {
    console.error('❌ summonToBattleBtn要素が見つかりません');
}

// ゲームイベントリスナー
if (elements.endTurnBtn) {
    console.log('✅ endTurnBtn要素確認: 正常に取得済み');
    elements.endTurnBtn.addEventListener('click', () => {
        console.log('🔄 ターン終了ボタンクリック');
        SoundManager.play('button');
        nextPhase();
    });
} else {
    console.error('❌ endTurnBtn要素が見つかりません');
}

if (elements.skipActionBtn) {
    elements.skipActionBtn.addEventListener('click', () => {
    console.log('🎮 skipActionBtn クリックイベント発火:', {
        'ボタンテキスト': elements.skipActionBtn.textContent,
        'ゲームフェーズ': gameState.phase,
        'ボタン表示状態': elements.skipActionBtn.style.display,
        'ボタン無効状態': elements.skipActionBtn.disabled,
        'クリック発生時刻': new Date().toLocaleTimeString()
    });
    
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
} else {
    console.error('❌ skipActionBtn要素が見つかりません');
}

// ゲーム再開ボタンのイベントリスナー
if (elements.restartGameBtn) {
    elements.restartGameBtn.addEventListener('click', () => {
        console.log('🔄 ゲーム再開ボタンクリック: initializeGame()を実行');
        SoundManager.play('button');
        initializeGame();
        console.log('✅ ゲーム再開処理完了');
    });
} else {
    console.error('❌ restartGameBtn要素が見つかりません');
}

// ヘルプイベントリスナーは統合初期化システムに移動済み ✅

// 🎭 勝敗結果モーダルイベントリスナーは統合初期化システムに移動済み ✅

// 右下ゲーム再開ボタンは削除済み（既存endTurnBtnシステムを活用）

// ハンバーガーメニューイベントリスナーは統合初期化システムに移動済み ✅

// メニュー外クリックで閉じる
document.addEventListener('click', (e) => {
    const menu = elements.hamburgerMenu;
    const btn = elements.hamburgerBtn;
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// 音響パネル制御（強化版）
if (elements.audioToggle && elements.audioPanel) {
    console.log('✅ 音響パネル要素確認:', {
        audioToggle: !!elements.audioToggle,
        audioPanel: !!elements.audioPanel,
        hamburgerMenu: !!elements.hamburgerMenu
    });
    
    elements.audioToggle.addEventListener('click', (e) => {
        console.log('🎵 音響パネルボタンクリック開始');
        e.preventDefault();
        e.stopPropagation();
        
        SoundManager.play('button');
        
        const panel = elements.audioPanel;
        const currentDisplay = window.getComputedStyle(panel).display;
        console.log('🎵 現在の音響パネル表示状態:', currentDisplay);
        
        if (currentDisplay === 'none') {
            panel.style.display = 'block';
            panel.style.visibility = 'visible';
            panel.style.opacity = '1';
            console.log('📂 音響パネル表示');
        } else {
            panel.style.display = 'none';
            console.log('📁 音響パネル非表示');
        }
        
        // ハンバーガーメニューを閉じる
        if (elements.hamburgerMenu) {
            elements.hamburgerMenu.style.display = 'none';
            console.log('🍔 ハンバーガーメニュー閉じる');
        }
    });
} else {
    console.error('❌ 音響パネル要素が見つかりません:', {
        audioToggle: !!elements.audioToggle,
        audioPanel: !!elements.audioPanel
    });
}

// 音響パネル閉じるボタンはAlpine.jsで処理（HTML側で @click 実装済み）

// BGM切り替えはAlpine.jsで処理（HTML側で @click 実装済み）

// SE切り替えはAlpine.jsで処理（HTML側で @click 実装済み）

// BGM音量調整はAlpine.jsで処理（HTML側で @input 実装済み）

// SE音量調整はAlpine.jsで処理（HTML側で @input 実装済み）

// 降参ボタン（メニュー内）のイベントリスナー
if (elements.surrenderMenuBtn && elements.surrenderModal) {
    elements.surrenderMenuBtn.addEventListener('click', () => {
        SoundManager.play('button');
        console.log('⚠️ 降参ボタンクリック');
        elements.hamburgerMenu.style.display = 'none';
        elements.surrenderModal.style.display = 'flex';
    });
}

// 降参確認ボタンのイベントリスナー
if (elements.surrenderConfirmBtn) {
    elements.surrenderConfirmBtn.addEventListener('click', () => {
        SoundManager.play('button');
        console.log('⚠️ 降参確定');
        elements.surrenderModal.style.display = 'none';
        
        // 降参処理：敗北として処理
        gameState.gameOver = true;
        showGameResultModal('defeat', '降参しました');
        
        // 少し待ってから自動でゲームを再開
        setTimeout(() => {
            console.log('🔄 降参後の自動ゲーム再開');
            initializeGame();
        }, 2000);
    });
}

// 降参キャンセルボタンのイベントリスナー
if (elements.surrenderCancelBtn) {
    elements.surrenderCancelBtn.addEventListener('click', () => {
        SoundManager.play('button');
        console.log('❌ 降参キャンセル');
        elements.surrenderModal.style.display = 'none';
    });
}

// モーダル背景クリックで閉じる
elements.surrenderModal.addEventListener('click', (e) => {
    if (e.target === elements.surrenderModal) {
        SoundManager.play('button');
        elements.surrenderModal.style.display = 'none';
    }
});

document.getElementById('result-close-btn').addEventListener('click', () => {
    console.log('❌ 結果モーダルを閉じる');
    SoundManager.play('button');
    document.getElementById('game-result-modal').style.display = 'none';
    
    // 統一ボタン管理システムに委任（直接操作を廃止）
    gameState.gameOver = true; // ゲーム終了フラグを設定
    updateButtonStates(); // 統一システムでボタン状態を更新
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

// 🚀 統合初期化用ヘルパー関数群

// SoundManager非同期初期化ラッパー
async function initializeSoundManager() {
    console.log('🔊 SoundManager初期化ラッパー開始');
    
    // 既に初期化済みかチェック
    if (SoundManager.sounds.button) {
        console.log('✅ SoundManager既に初期化済み');
        return true;
    }
    
    // 非同期初期化実行
    const result = await SoundManager.initAsync();
    return result;
}

// イベントリスナー統合登録
function initializeEventListeners() {
    console.log('🎯 イベントリスナー統合登録開始');
    
    // スタートボタンイベント（移動してくる）
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', () => {
            console.log('🎮 ゲーム開始ボタンクリック');
            
            // SE再生: ボタン
            SoundManager.play('button');
            
            // BGM開始（初回ユーザー操作）
            SoundManager.startBGM();
            
            // スタート画面を非表示にしてゲーム開始
            elements.startScreen.style.display = 'none';
            document.getElementById('game-viewport').style.display = 'block';
            
            // ゲーム初期化
            initializeGame();
        });
        console.log('✅ スタートボタンイベント登録完了');
    }
    
    // 結果モーダル再開ボタン（移動してくる）
    const resultRestartBtn = document.getElementById('result-restart-btn');
    if (resultRestartBtn) {
        resultRestartBtn.addEventListener('click', (e) => {
            console.log('🔄 結果モーダルからゲーム再開クリック');
            e.preventDefault();
            e.stopPropagation();
            
            SoundManager.play('button');
            
            // モーダルを閉じる
            const modal = document.getElementById('game-result-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // 🔄 フィールドリセット前の状況確認
            console.log('🔍 ゲーム再開前フィールド状況:', {
                'プレイヤーフィールド': gameState.playerField?.map((c, i) => c ? `スロット${i}:${c.name}` : `スロット${i}:空`),
                '敵フィールド': gameState.enemyField?.map((c, i) => c ? `スロット${i}:${c.name}` : `スロット${i}:空`),
                'ゲーム終了状態': gameState.gameOver || false
            });

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

            // 🔄 フィールドリセット後の確認
            console.log('✅ ゲーム状態リセット完了:', {
                'プレイヤーフィールド': gameState.playerField,
                '敵フィールド': gameState.enemyField,
                'フェーズ': gameState.phase,
                'ゲーム終了フラグ': gameState.gameOver
            });
            
            // ボタンを元の状態に戻す
            if (elements.endTurnBtn) {
                elements.endTurnBtn.textContent = 'ターン終了';
                elements.endTurnBtn.className = 'action-button primary';
            }
            
            // ゲーム再開
            initializeGame();
        });
        console.log('✅ 結果モーダル再開ボタンイベント登録完了');
    }
    
    // ハンバーガーメニューイベント
    if (elements.hamburgerBtn && elements.hamburgerMenu) {
        elements.hamburgerBtn.addEventListener('click', () => {
            SoundManager.play('button');
            console.log('🍔 ハンバーガーメニュークリック');
            const menu = elements.hamburgerMenu;
            if (menu.style.display === 'none' || menu.style.display === '') {
                menu.style.display = 'block';
            } else {
                menu.style.display = 'none';
            }
        });
        console.log('✅ ハンバーガーメニューイベント登録完了');
    }
    
    // ヘルプ関連イベント
    const helpToggle = document.getElementById('help-toggle');
    const helpModal = document.getElementById('help-modal');
    const helpClose = document.getElementById('help-close');
    
    if (helpToggle && helpModal) {
        helpToggle.addEventListener('click', () => {
            SoundManager.play('button');
            helpModal.style.display = 'flex';
            // ハンバーガーメニューを閉じる
            if (elements.hamburgerMenu) {
                elements.hamburgerMenu.style.display = 'none';
            }
        });
        console.log('✅ ヘルプトグルイベント登録完了');
    }
    
    if (helpClose && helpModal) {
        helpClose.addEventListener('click', () => {
            SoundManager.play('button');
            helpModal.style.display = 'none';
        });
        console.log('✅ ヘルプクローズイベント登録完了');
    }
    
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'help-modal') {
                helpModal.style.display = 'none';
            }
        });
        console.log('✅ ヘルプモーダル背景クリックイベント登録完了');
    }
    
    // 重複する音響トグルイベントを削除済み（elements.audioToggleで処理）
    
    // 降参関連イベント
    const surrenderMenuBtn = document.getElementById('surrender-menu-btn');
    const surrenderModal = document.getElementById('surrender-modal');
    const surrenderConfirmBtn = document.getElementById('surrender-confirm-btn');
    const surrenderCancelBtn = document.getElementById('surrender-cancel-btn');
    
    if (surrenderMenuBtn && surrenderModal) {
        surrenderMenuBtn.addEventListener('click', () => {
            SoundManager.play('button');
            surrenderModal.style.display = 'flex';
            // ハンバーガーメニューを閉じる
            if (elements.hamburgerMenu) {
                elements.hamburgerMenu.style.display = 'none';
            }
        });
        console.log('✅ 降参メニューイベント登録完了');
    }
    
    if (surrenderConfirmBtn) {
        surrenderConfirmBtn.addEventListener('click', () => {
            SoundManager.play('button');
            showGameResultModal('defeat', '降参しました');
            if (surrenderModal) {
                surrenderModal.style.display = 'none';
            }
        });
        console.log('✅ 降参確認イベント登録完了');
    }
    
    if (surrenderCancelBtn && surrenderModal) {
        surrenderCancelBtn.addEventListener('click', () => {
            SoundManager.play('button');
            surrenderModal.style.display = 'none';
        });
        console.log('✅ 降参キャンセルイベント登録完了');
    }
    
    console.log('🎯 イベントリスナー統合登録完了');
}

// ゲーム開始は統合初期化システムで管理 ✅

// 🚀 統合初期化システム（DOM読み込み後）
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOMContentLoaded: 統合初期化開始');
    
    try {
        // Phase 1: SoundManager初期化 (async/await で確実な完了待機)
        console.log('🔊 SoundManager初期化開始...');
        await initializeSoundManager();
        
        // Phase 2: Alpine.js同期とグローバル参照確保
        console.log('🎵 Alpine.js-SoundManager同期確保...');
        window.SoundManager = SoundManager; // グローバル参照確保
        
        // Phase 3: イベントリスナー一括登録
        console.log('🎯 イベントリスナー統合登録...');
        initializeEventListeners();
        
        // Phase 4: ヘルプタブ初期化
        console.log('❓ ヘルプタブシステム初期化...');
        initializeHelpTabs();
        
        console.log('✅ DOMContentLoaded: 統合初期化完了');
        
    } catch (error) {
        console.error('❌ 統合初期化エラー:', error);
    }
});