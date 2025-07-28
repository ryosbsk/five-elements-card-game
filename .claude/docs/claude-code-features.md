# Claude Code 機能リファレンス

## Hooks システム

### 基本構造
```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'メッセージ'"
          }
        ]
      }
    ]
  }
}
```

### イベント種類
- **UserPromptSubmit**: ユーザープロンプト送信時
- **PreToolUse**: ツール実行前
- **PostToolUse**: ツール実行後
- **Stop**: エージェント応答完了時

### マッチャーパターン
- `*`: 全てにマッチ
- `Edit|Write|MultiEdit`: 複数ツールにマッチ
- `Edit.*\\.js`: JavaScript ファイル編集時
- 正規表現使用可能

### 実用例
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit.*\\.css",
        "hooks": [
          {
            "type": "command",
            "command": "echo '🎨 CSS変更完了: /ux-review でUI検証推奨'"
          }
        ]
      }
    ]
  }
}
```

## Slash Commands

### 設置場所
- プロジェクト固有: `.claude/commands/`
- 個人設定: `~/.claude/commands/`

### 基本フォーマット
```markdown
# Command Title

Command description here.

## Usage
How to use this command.

## Expected Output
What this command produces.
```

### 引数対応
- `$ARGUMENTS`: コマンド引数を挿入
- 例: `/my-command arg1 arg2` → `$ARGUMENTS` = "arg1 arg2"

### 実行例
- `/game-debug`: ゲームデバッグ実行
- `/ux-review`: UI/UX分析実行
- `/code-review $ARGUMENTS`: 指定ファイルのコードレビュー

## Sub Agents

### 設置場所
`.claude/agents/` ディレクトリ

### 基本構造
```markdown
# Agent Name

## 専門領域
Agent's specialization

## 実行タイミング
When to use this agent

## 分析観点
What this agent analyzes

## 提案形式
How this agent presents results
```

### エージェント呼び出し
- Task tool経由で呼び出し
- hooks から自動推奨
- slash commands から実行

## 設定階層

### 優先順位
1. プロジェクト設定 (`.claude/settings.json`)
2. 個人設定 (`~/.claude/settings.json`)
3. グローバル設定

### 設定継承
- 下位設定が上位設定を上書き
- プロジェクト固有の設定を優先
- 汎用設定は上位で定義

## ベストプラクティス

### Hooks設計
- 過度な通知を避ける
- 文脈に応じた適切な提案
- パフォーマンスを考慮した軽量実装

### Slash Commands設計
- 明確で覚えやすい名前
- 適切な説明と使用例
- 引数設計の一貫性

### Agents設計
- 専門領域の明確化
- 実行タイミングの適切な定義
- 出力フォーマットの統一

### プロジェクト管理
- 設定ファイルのバージョン管理
- 文書化の徹底
- 定期的な設定見直し