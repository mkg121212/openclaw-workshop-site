#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${1:-openclaw-workshop-site}"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install GitHub CLI first."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Please login first: gh auth login"
  exit 1
fi

if [ ! -f "index.html" ] && [ -f "点开这个.html" ]; then
  cp -f "点开这个.html" index.html
fi

if [ ! -d ".git" ]; then
  git init
  git branch -M main
fi

git add .
git commit -m "deploy: static site" || true

if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
else
  git push -u origin main
fi

OWNER="$(gh api user -q .login)"

if ! gh api "repos/${OWNER}/${REPO_NAME}/pages" >/dev/null 2>&1; then
  gh api -X POST "repos/${OWNER}/${REPO_NAME}/pages" \
    -F "source[branch]=main" \
    -F "source[path]=/"
fi

echo ""
echo "Deploy requested. Your site URL will be:"
echo "https://${OWNER}.github.io/${REPO_NAME}/"
