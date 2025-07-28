# 開発ベストプラクティス集

## プロンプト最適化

### 効果的なプロンプトパターン

#### 段階的アプローチ
```
❌ 悪い例:
「カードゲームのUIを改善して」

✅ 良い例:
「五行カードゲームのバトル画面で、カード選択時の視認性を改善したいです。
現在の問題: カード選択状態が分かりにくい
改善目標: 選択中のカードを明確に識別できる
制約: 既存のTailwind設定を活用」
```

#### 具体的な文脈提供
```
❌ 悪い例:
「エラーが出ます」

✅ 良い例:
「戦闘フェーズでプレイヤーカードから敵カードを攻撃する際、
script.js:247行目で『Cannot read property 'hp' of undefined』
エラーが発生します。再現手順: 
1. ゲーム開始
2. カード配置
3. 戦闘フェーズ移行
4. プレイヤーカード攻撃実行」
```

### 指示の構造化
```
🎯 目的: [何を達成したいか]
🔍 現状: [現在の状況]
⚡ 要求: [具体的な変更内容]
🚫 制約: [守るべき条件]
📋 確認: [実装後の確認方法]
```

## コード開発プロセス

### 事前確認チェックリスト
- [ ] 既存システムの調査完了
- [ ] 類似機能の存在確認
- [ ] DOM構造の最適性検討
- [ ] セキュリティ要件の確認
- [ ] パフォーマンス影響の評価

### 段階的実装アプローチ
1. **最小実装**: 基本機能のみ実装
2. **動作確認**: エラー・問題の早期発見
3. **機能拡張**: 段階的な機能追加
4. **最適化**: パフォーマンス・品質向上
5. **文書化**: 実装内容の記録

### エラー対策パターン
```javascript
// 防御的プログラミング
if (!card || !card.hp) {
  console.error('🚨 カードデータ不正:', card);
  return;
}

// 詳細ログ出力
console.log('🎯 攻撃処理開始:', {
  attacker: attacker.name,
  defender: defender.name,
  damage: calculatedDamage
});
```

## UI/UX設計原則

### 情報階層の設計
1. **Critical**: 即座判断が必要な情報（HP、攻撃力）
2. **Important**: 戦略判断に必要な情報（属性、スピード）
3. **Supporting**: 補助的情報（コスト、フレーバー）

### 操作効率の最適化
- **右手操作**: メインボタンを右側配置
- **連続操作**: 関連ボタンを近接配置
- **操作頻度**: 高頻度操作を優先配置

### レスポンシブ対応
```css
/* モバイルファースト */
.card {
  width: 100%;
  max-width: 200px;
}

/* タブレット */
@media (min-width: 768px) {
  .card {
    max-width: 250px;
  }
}

/* デスクトップ */
@media (min-width: 1024px) {
  .card {
    max-width: 300px;
  }
}
```

## デバッグ・テスト戦略

### ログ設計パターン
```javascript
// 処理開始・終了の追跡
console.log('🎯 処理開始: updateCardStatus');
// ... 処理 ...
console.log('✅ 処理完了: updateCardStatus');

// 重要な状態変更
console.log('📊 ゲーム状態変更:', {
  before: previousState,
  after: currentState,
  trigger: 'user_action'
});

// エラー詳細情報
console.error('🚨 エラー発生:', {
  function: 'calculateDamage',
  input: { attacker, defender },
  error: error.message,
  stack: error.stack
});
```

### テストシナリオ
1. **正常系**: 基本的な操作フロー
2. **準正常系**: エッジケース（同速攻撃など）
3. **異常系**: エラー状況の処理
4. **性能**: 大量データでの動作
5. **互換性**: 異なるブラウザでの動作

## プロジェクト管理

### ファイル構成ベストプラクティス
```
five-elements-card-game/
├── .claude/
│   ├── agents/          # 専門エージェント
│   ├── commands/        # カスタムslash commands
│   ├── docs/           # 知識ベース
│   └── settings.json   # hooks設定
├── .vscode/            # VS Code設定
├── .github/            # GitHub設定
├── index.html          # メインHTML
├── script.js           # ゲームロジック
├── style.css           # スタイル
└── CLAUDE.md          # プロジェクト設定
```

### バージョン管理
- 機能追加前のブランチ作成
- 詳細なコミットメッセージ
- プルリクエストでのレビュー
- 定期的なバックアップ

### 継続的改善
- 定期的な設定見直し
- 新機能の学習・適用
- フィードバックの収集・反映
- ベストプラクティスの更新

## 効率化Tips

### VS Code活用
- `Ctrl+Shift+P`: コマンドパレット
- `Ctrl+` : ターミナル表示
- `F12`: 定義にジャンプ
- `Shift+F12`: 参照を検索

### Claude Code活用
- `/help`: 機能確認
- `/add-dir`: ディレクトリ追加
- `/review`: コードレビュー
- `/agents`: 利用可能エージェント確認

### デバッグ効率化
- ブラウザ開発者ツール活用
- Network タブでリソース確認
- Console タブでエラー・ログ確認
- Elements タブでDOM構造確認