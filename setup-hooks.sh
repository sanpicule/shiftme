#!/bin/bash

echo "🔧 Gitフックをセットアップしています..."

# hooks/commit-msgファイルを.git/hooks/にコピー
cp hooks/commit-msg .git/hooks/commit-msg

# 実行権限を付与
chmod +x .git/hooks/commit-msg

echo "✅ Gitフックのセットアップが完了しました！"
echo ""
echo "使い方："
echo "  git commit -m \"fix: バグを修正\" → 🐛 fix: バグを修正"
echo "  git commit -m \"feat: 新機能追加\" → ✨ feat: 新機能追加"
echo "  git commit -m \"docs: ドキュメント更新\" → 📚 docs: ドキュメント更新"
echo ""
echo "対応するプレフィックス："
echo "  fix:, bug: → 🐛"
echo "  feat:, feature: → ✨"
echo "  docs: → 📚"
echo "  style: → 💄"
echo "  refactor: → ♻️"
echo "  perf: → ⚡"
echo "  test: → 🧪"
echo "  chore: → 🔧"
echo "  ci: → 👷"
echo "  build: → 🏗️"
echo "  revert: → ⏪"
echo "  hotfix: → 🚨"
echo "  security: → 🔒"
echo "  wip: → 🚧"
echo "  merge: → 🔀"
