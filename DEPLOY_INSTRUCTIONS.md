# デプロイ手順

## ビルド状況

ビルドが正常に完了しました。

## Netlifyへのデプロイ方法

### 方法1: Netlify CLIで直接デプロイ

1. Netlifyにログイン:

```bash
netlify login
```

2. デプロイを実行:

```bash
netlify deploy --prod
```

3. 初回デプロイ時の質問に回答:
   - サイトを作成しますか? → Yes
   - チーム選択 → 該当するチームを選択
   - サイト名 → 任意の名前（既存のサイトがある場合は既存サイトを選択）
   - デプロイディレクトリ → ./dist

### 方法2: GitHubと連携して自動デプロイ

1. GitHubにコードをプッシュ:

```bash
git add .
git commit -m "Add Netlify configuration"
git push
```

2. Netlifyダッシュボードにアクセス:
   - https://app.netlify.com/
   - "Add new site" → "Import an existing project"
   - GitHubリポジトリを選択
   - ビルド設定は自動的にnetlify.tomlから読み込まれます

3. 環境変数の設定:
   Netlifyダッシュボードで以下の環境変数を設定してください:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

### 方法3: 手動でdistフォルダをアップロード

1. Netlifyダッシュボードにアクセス
2. "Add new site" → "Deploy manually"
3. distフォルダをドラッグ&ドロップ

## 重要: 環境変数の設定

デプロイ後、必ずNetlifyの環境変数を設定してください:

- Site settings → Environment variables
- 以下を追加:
  - VITE_SUPABASE_URL=your_supabase_url
  - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

環境変数を設定したら、再度ビルドをトリガーしてください。

## 既存のサイトを更新する場合

既存のNetlifyサイト（https://lively-marzipan-614a01.netlify.app/）を更新する場合:

```bash
netlify link
```

でサイトをリンクしてから:

```bash
netlify deploy --prod
```

でデプロイしてください。

## ビルド成果物

以下のファイルがdistフォルダに生成されています:

- index.html
- assets/ (CSS, JavaScript)
- manifest.json
- sw.js (Service Worker)
- アイコン画像

## PWA対応

このアプリはPWA対応しているため、デプロイ後にユーザーはホーム画面に追加してアプリとして利用できます。
