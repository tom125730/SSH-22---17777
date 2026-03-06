#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-v1.0.0}"
REPO_URL="${2:-${REPO_URL:-}}"
BRANCH="$(git branch --show-current)"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[ERROR] 当前目录不是 Git 仓库" >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  if [[ -z "$REPO_URL" ]]; then
    cat >&2 <<MSG
[ERROR] 未检测到 remote 'origin'。
请传入仓库地址：
  ./scripts/release.sh ${TAG} git@github.com:<owner>/<repo>.git
或：
  REPO_URL=https://github.com/<owner>/<repo>.git ./scripts/release.sh ${TAG}
MSG
    exit 2
  fi
  git remote add origin "$REPO_URL"
  echo "[INFO] 已添加 origin -> $REPO_URL"
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "[ERROR] 工作区有未提交内容，请先提交后再发布。" >&2
  exit 3
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "[INFO] 标签 $TAG 已存在，跳过创建。"
else
  git tag -a "$TAG" -m "Release $TAG"
  echo "[INFO] 已创建标签 $TAG"
fi

echo "[INFO] 推送分支: $BRANCH"
git push -u origin "$BRANCH"

echo "[INFO] 推送标签: $TAG"
git push origin "$TAG"

echo "[DONE] 发布触发成功。请在 GitHub Actions / Releases 页面查看进度。"
