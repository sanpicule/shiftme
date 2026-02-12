# ファイル/フォルダの用途（src/public/node_modules は除外）

本リポジトリの主要なフォルダ/ファイルと用途を表形式でまとめます。対象外: `src/`, `public/`, `node_modules/`。

| 対象フォルダ/ファイル | 用途                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------- |
| `.bolt/`              | Bolt 等のAIエージェント用設定とプロンプト                                              |
| `.cursor/`            | Cursor/MCP の設定                                                                      |
| `.env`                | 実行時の環境変数（APIキー等）。Git 追跡外                                              |
| `.env.example`        | 必要な環境変数のサンプル定義                                                           |
| `.github/workflows/`  | GitHub Actions（`gemini-*.yml` は Gemini 連携の自動化）                                |
| `.gitignore`          | 版管理から除外する対象の定義（`dist`, `.env`, `.DS_Store` 等）                         |
| `.vscode/`            | VS Code ワークスペース設定（`settings.json` 等）                                       |
| `eslint.config.js`    | ESLint 設定（TS/React Hooks, `dist` 除外）                                             |
| `postcss.config.js`   | PostCSS 設定（Tailwind, Autoprefixer）                                                 |
| `tailwind.config.js`  | Tailwind のスキャン対象・テーマ拡張（色/アニメ/影 等）                                 |
| `tsconfig.json`       | TS プロジェクト参照のルート（`tsconfig.app.json`, `tsconfig.node.json` を参照）        |
| `tsconfig.app.json`   | ブラウザアプリ用の TS 設定（`strict`, `react-jsx`, bundler モード 等）                 |
| `tsconfig.node.json`  | Node 用 TS 設定（`vite.config.ts` など）                                               |
| `vite.config.ts`      | Vite 設定（React プラグイン、`dist` 出力、`manualChunks` 分割、`server.host = true`）  |
| `dist/`               | ビルド成果物（配布用）。`assets/`, `index.html`, `manifest.json`, `sw.js`, アイコン 等 |
| `supabase/`           | Supabase 関連（DB マイグレーション等）                                                 |
