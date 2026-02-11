# Shiftme

ShiftMeは、日々の支出を管理し、貯金目標の達成をサポートするために設計されたプログレッシブウェブアプリケーション（PWA）です。
直感的なインターフェースで収支を記録し、目標達成までの進捗を視覚的に追跡できます。

## 主な機能

- **ダッシュボード:** 収支の概要をひと目で確認できます。
- **支出管理:** 簡単な操作で支出を記録し、カレンダー形式で履歴を閲覧できます。
- **分析ページ:** グラフやチャートを用いて、支出の傾向を分析します。
- **貯金目標設定:** 目標金額や期間を設定し、進捗を管理できます。
- **ユーザー認証:** 安全な認証機能により、個人のデータを保護します。
- **PWA対応:** スマートフォンやデス- トップにインストールして、ネイティブアプリのように利用できます。

![](/public/readme-system.png)
![](/public/readme-tools.png)

## セットアップと実行方法

### 1. 前提条件

- [Node.js](https://nodejs.org/) (v18以上を推奨)
- [npm](https://www.npmjs.com/)

### 2. プロジェクトのクローン

```bash
git clone https://github.com/your-username/shiftme-savings-app.git
cd shiftme-savings-app
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. Gitフックのセットアップ（Husky）

Huskyを使用して、コミット時に自動でコードフォーマット、リント、コミットメッセージのチェックを行います。

初回のセットアップ後、以下の機能が自動で実行されます：

**Pre-commit（コミット前）:**

- 変更されたファイルに対してESLintとPrettierを自動実行
- コードスタイルの統一と問題の早期発見

**Commit-msg（コミットメッセージ）:**

- Conventional Commitsルールに基づいたメッセージチェック
- 自動で絵文字を追加（例: `fix:` → 🐛 fix:）

**Pre-push（プッシュ前）:**

- プロジェクト全体のリントとビルドを実行
- プッシュ前に問題を検出

#### サポートされているコミットプレフィックス:

- `fix:`, `bug:` → 🐛 バグ修正
- `feat:`, `feature:` → ✨ 新機能
- `docs:` → 📚 ドキュメント更新
- `style:` → 💄 スタイル変更
- `refactor:` → ♻️ リファクタリング
- `perf:` → ⚡ パフォーマンス改善
- `test:` → 🧪 テスト追加
- `chore:` → 🔧 雑務
- `ci:` → 👷 CI設定
- `build:` → 🏗️ ビルド設定
- `revert:` → ⏪ リバート
- `hotfix:` → 🚨 緊急修正
- `security:` → 🔒 セキュリティ修正
- `wip:` → 🚧 作業中
- `merge:` → 🔀 マージ

#### 手動でのフォーマットとリント:

```bash
# すべてのファイルをフォーマット
npm run format

# フォーマットチェック（修正なし）
npm run format:check

# リント実行
npm run lint

# リント実行と自動修正
npm run lint:fix
```

**注意:** 依存関係のインストール時に `npm install` を実行すると、Huskyが自動でセットアップされます。

### 5. 環境変数の設定

プロジェクトのルートに`.env`ファイルを作成し、SupabaseプロジェクトのURLとAnonキーを設定します。`.env.example`ファイルを参考にしてください。

```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3001` を開いてください。

### 7. ビルド

本番用のファイルを生成するには、以下のコマンドを実行します。

```bash
npm run build
```

ビルドされたファイルは`dist`ディレクトリに出力されます。
