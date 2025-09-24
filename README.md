# ShiftMe Savings App

ShiftMeは、日々の支出を管理し、貯金目標の達成をサポートするために設計されたプログレッシブウェブアプリケーション（PWA）です。
直感的なインターフェースで収支を記録し、目標達成までの進捗を視覚的に追跡できます。

## 主な機能

- **ダッシュボード:** 収支の概要をひと目で確認できます。
- **支出管理:** 簡単な操作で支出を記録し、カレンダー形式で履歴を閲覧できます。
- **分析ページ:** グラフやチャートを用いて、支出の傾向を分析します。
- **貯金目標設定:** 目標金額や期間を設定し、進捗を管理できます。
- **ユーザー認証:** 安全な認証機能により、個人のデータを保護します。
- **PWA対応:** スマートフォンやデス- トップにインストールして、ネイティブアプリのように利用できます。

## 技術スタック

- **フロントエンド:**
  - [React](https://reactjs.org/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Vite](https://vitejs.dev/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Material-UI](https://mui.com/)
- **バックエンド & データベース:**
  - [Supabase](https://supabase.io/)

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

### 4. 環境変数の設定

プロジェクトのルートに`.env`ファイルを作成し、SupabaseプロジェクトのURLとAnonキーを設定します。`.env.example`ファイルを参考にしてください。

```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3001` を開いてください。

### 6. ビルド

本番用のファイルを生成するには、以下のコマンドを実行します。

```bash
npm run build
```

ビルドされたファイルは`dist`ディレクトリに出力されます。