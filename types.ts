// 五行カードバトルゲーム - TypeScript型定義

/**
 * 五行属性の種類
 */
export type Element = '木' | '火' | '土' | '金' | '水';

/**
 * ゲームフェーズの種類
 */
export type GamePhase = 'summon' | 'battle' | 'end';

/**
 * カード情報の型定義
 */
export interface Card {
  /** カードID */
  id: number;
  /** カード名 */
  name: string;
  /** 属性（木火土金水） */
  element: Element;
  /** コスト */
  cost: number;
  /** 体力 */
  hp: number;
  /** 最大体力 */
  maxHp: number;
  /** 攻撃力 */
  attack: number;
  /** スピード */
  speed: number;
  /** プレイヤーカードか */
  isPlayer: boolean;
  /** 行動済みか */
  hasActed: boolean;
  /** フィールド位置（0-2、未配置時は-1） */
  fieldPosition: number;
}

/**
 * メッセージ履歴の型定義
 */
export interface GameMessage {
  /** メッセージテキスト */
  text: string;
  /** タイムスタンプ */
  timestamp: number;
  /** メッセージ種類 */
  type?: 'info' | 'warning' | 'success' | 'error';
}

/**
 * ゲーム状態の型定義
 */
export interface GameState {
  /** プレイヤーフィールド */
  playerField: Card[];
  /** 敵フィールド */
  enemyField: Card[];
  /** プレイヤー手札 */
  playerHand: Card[];
  /** 敵手札 */
  enemyHand: Card[];
  /** プレイヤーPP */
  playerPP: number;
  /** プレイヤー最大PP */
  playerMaxPP: number;
  /** 敵PP */
  enemyPP: number;
  /** 敵最大PP */
  enemyMaxPP: number;
  /** ターン数 */
  turn: number;
  /** 現在のフェーズ */
  phase: GamePhase;
  /** 撃破済みコスト */
  defeatedCost: number;
  /** メッセージ履歴 */
  messageHistory: GameMessage[];
  /** ゲーム終了フラグ */
  isGameOver: boolean;
  /** 勝者（null=進行中、'player'=プレイヤー勝利、'enemy'=敵勝利、'draw'=引き分け） */
  winner: 'player' | 'enemy' | 'draw' | null;
}

/**
 * 五行相剋関係の型定義
 */
export interface ElementAdvantage {
  /** 攻撃属性 */
  attacker: Element;
  /** 防御属性 */
  defender: Element;
  /** 有効かどうか */
  isEffective: boolean;
}

/**
 * ダメージ計算結果の型定義
 */
export interface DamageCalculation {
  /** 基本ダメージ */
  baseDamage: number;
  /** 相剋ボーナス */
  advantageBonus: number;
  /** 最終ダメージ */
  finalDamage: number;
  /** 相剋有効かどうか */
  hasAdvantage: boolean;
}

/**
 * 戦闘結果の型定義
 */
export interface BattleResult {
  /** 攻撃者 */
  attacker: Card;
  /** 防御者 */
  defender: Card;
  /** ダメージ計算結果 */
  damage: DamageCalculation;
  /** 防御者が撃破されたか */
  isDefenderDefeated: boolean;
  /** 戦闘メッセージ */
  message: string;
}

/**
 * 行動順序の型定義
 */
export interface ActionOrder {
  /** カード */
  card: Card;
  /** スピード */
  speed: number;
  /** 行動順序（小さいほど早い） */
  order: number;
}

/**
 * 音響設定の型定義
 */
export interface AudioSettings {
  /** BGM有効フラグ */
  bgmEnabled: boolean;
  /** SE有効フラグ */
  seEnabled: boolean;
  /** BGMボリューム（0-100） */
  bgmVolume: number;
  /** SEボリューム（0-100） */
  seVolume: number;
}

/**
 * カードマスターデータの型定義
 */
export interface CardMaster {
  /** カードID */
  id: number;
  /** カード名 */
  name: string;
  /** 属性 */
  element: Element;
  /** コスト */
  cost: number;
  /** 基本HP */
  baseHp: number;
  /** 基本攻撃力 */
  baseAttack: number;
  /** スピード */
  speed: number;
  /** 画像パス */
  imagePath: string;
  /** 説明文 */
  description?: string;
}

/**
 * UI要素参照の型定義
 */
export interface UIElements {
  /** ゲームコンテナ */
  gameContainer: HTMLElement;
  /** プレイヤーフィールド */
  playerBattlefield: HTMLElement;
  /** 敵フィールド */
  enemyBattlefield: HTMLElement;
  /** プレイヤー手札 */
  playerHand: HTMLElement;
  /** メッセージフィード */
  messageFeed: HTMLElement;
  /** 行動順表示 */
  turnOrder: HTMLElement;
  /** 各種ボタン */
  summonToBattleBtn: HTMLButtonElement;
  endTurnBtn: HTMLButtonElement;
  restartGameBtn: HTMLButtonElement;
  skipActionBtn: HTMLButtonElement;
  waitingBtn: HTMLButtonElement;
}

/**
 * イベントハンドラの型定義
 */
export type CardClickHandler = (card: Card, event: MouseEvent) => void;
export type GameStateChangeHandler = (newState: GameState, oldState: GameState) => void;
export type BattleCompleteHandler = (result: BattleResult) => void;

/**
 * ゲーム設定の型定義
 */
export interface GameConfig {
  /** 最大PP */
  maxPP: number;
  /** 初期手札数 */
  initialHandSize: number;
  /** フィールド最大枚数 */
  maxFieldSize: number;
  /** 勝利必要撃破コスト */
  victoryRequiredCost: number;
  /** アニメーション時間（ms） */
  animationDuration: number;
  /** メッセージ表示時間（ms） */
  messageDisplayDuration: number;
}

/**
 * 五行相剋テーブルの型定義
 */
export const ELEMENT_ADVANTAGES: readonly ElementAdvantage[] = [
  { attacker: '木', defender: '土', isEffective: true },
  { attacker: '火', defender: '金', isEffective: true },
  { attacker: '土', defender: '水', isEffective: true },
  { attacker: '金', defender: '木', isEffective: true },
  { attacker: '水', defender: '火', isEffective: true },
] as const;

/**
 * デフォルトゲーム設定
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  maxPP: 5,
  initialHandSize: 3,
  maxFieldSize: 3,
  victoryRequiredCost: 5,
  animationDuration: 300,
  messageDisplayDuration: 3000,
} as const;