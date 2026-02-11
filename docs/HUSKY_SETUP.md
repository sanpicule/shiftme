# Husky セットアップガイド

このドキュメントでは、Huskyを使用したコードフォーマッターとリンターの自動化について説明します。

## 概要

このプロジェクトでは、以下のツールを使用してコード品質を自動的に維持します：

- **Husky**: Gitフックの管理
- **lint-staged**: 変更されたファイルのみをチェック
- **Prettier**: コードフォーマッター
- **ESLint**: JavaScriptとTypeScriptのリンター
- **commitlint**: コミットメッセージの規約チェック

## 初回セットアップ

プロジェクトをクローンした後、以下のコマンドを実行してください：

```bash
npm install
```

このコマンドにより、Huskyが自動的に初期化され、Gitフックがセットアップされます。

## 自動実行される処理

### Pre-commit（コミット前）

変更されたファイルに対して以下が実行されます：

- **TypeScript/JavaScript ファイル (.ts, .tsx, .js, .jsx)**:
  - ESLintによる自動修正
  - Prettierによるコードフォーマット

- **その他のファイル (.json, .md, .css, .scss)**:
  - Prettierによるコードフォーマット

### Commit-msg（コミットメッセージ）

1. **Conventional Commits規約のチェック**
   - コミットメッセージが規約に準拠しているか検証
2. **絵文字の自動追加**
   - 適切なプレフィックスに応じて絵文字を自動追加

サポートされているプレフィックス：

- `fix:`, `bug:` → 🐛
- `feat:`, `feature:` → ✨
- `docs:` → 📚
- `style:` → 💄
- `refactor:` → ♻️
- `perf:` → ⚡
- `test:` → 🧪
- `chore:` → 🔧
- `ci:` → 👷
- `build:` → 🏗️
- `revert:` → ⏪
- `hotfix:` → 🚨
- `security:` → 🔒
- `wip:` → 🚧
- `merge:` → 🔀

### Pre-push（プッシュ前）

プッシュ前に以下が実行されます：

- **ESLint**: プロジェクト全体のリント
- **Build**: ビルドエラーがないか確認

## 手動でのコマンド実行

### フォーマット

```bash
# すべてのファイルをフォーマット
npm run format

# フォーマットチェック（修正なし）
npm run format:check
```

### リント

```bash
# リント実行
npm run lint

# リント実行と自動修正
npm run lint:fix
```

### ビルド

```bash
npm run build
```

## コミット例

```bash
# 正しいコミット例
git commit -m "feat: 新しいダッシュボード機能を追加"
# → 🎨 feat: 新しいダッシュボード機能を追加

git commit -m "fix: ログイン時のバグを修正"
# → 🐛 fix: ログイン時のバグを修正

git commit -m "docs: READMEを更新"
# → 📚 docs: READMEを更新
```

## トラブルシューティング

### フックが実行されない場合

```bash
# Huskyの再インストール
npm install
```

### フックをスキップしたい場合

緊急の場合のみ、以下のフラグを使用してフックをスキップできます：

```bash
# コミットフックをスキップ
git commit --no-verify -m "緊急修正"

# プッシュフックをスキップ
git push --no-verify
```

**注意**: フックのスキップは最小限にとどめてください。コード品質の維持が重要です。

### lint-stagedがエラーを返す場合

エラーメッセージを確認し、指摘された問題を修正してください。多くの場合、以下のコマンドで自動修正できます：

```bash
npm run lint:fix
npm run format
```

## CI/CD

GitHub Actionsにより、main/masterブランチへのプッシュとプルリクエスト時に、以下が自動実行されます：

- ESLintによる全ファイルのリント
- Prettierによるフォーマットチェック
- プロジェクトのビルド

ワークフローファイル: `.github/workflows/lint-and-build.yml`

## 設定ファイル

- `.prettierrc`: Prettier設定
- `.prettierignore`: Prettierで無視するファイル
- `commitlint.config.cjs`: commitlint設定
- `.husky/`: Huskyフックスクリプト
- `package.json`: lint-staged設定

## 参考資料

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Prettier Documentation](https://prettier.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
