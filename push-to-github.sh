#!/bin/bash
# ============================================
# Push DREC PMS to GitHub
# ============================================
# Usage: ./push-to-github.sh <GITHUB_TOKEN>
# 
# To create a GitHub Personal Access Token:
# 1. Go to https://github.com/settings/tokens
# 2. Click "Generate new token (classic)"
# 3. Select scopes: repo (full control)
# 4. Copy the token and run: ./push-to-github.sh ghp_xxxxxxxxxxxx
# ============================================

set -e

TOKEN="${1:-}"
REPO="JohnzzzAntony/Jaber"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: GitHub token required"
  echo ""
  echo "Usage: ./push-to-github.sh <GITHUB_TOKEN>"
  echo ""
  echo "To create a token:"
  echo "  1. Go to https://github.com/settings/tokens"
  echo "  2. Generate new token (classic) with 'repo' scope"
  echo "  3. Run: ./push-to-github.sh ghp_your_token_here"
  exit 1
fi

echo "🚀 Pushing DREC PMS to github.com/$REPO..."

# Set remote with token
git remote set-url origin "https://${TOKEN}@github.com/${REPO}.git"

# Push
git push -u origin main --force

# Clean up token from remote URL
git remote set-url origin "https://github.com/${REPO}.git"

echo ""
echo "✅ Successfully pushed to https://github.com/$REPO"
