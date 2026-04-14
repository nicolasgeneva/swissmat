#!/bin/bash
# SwissMAT Sàrl — Deploy to NUC staging
# Usage: ./deploy.sh

set -euo pipefail

NUC_HOST="nuc"
NUC_PATH="/home/nicolasvillard/.openclaw/workspace/projects/swissmat"
LOCAL_PATH="$(cd "$(dirname "$0")" && pwd)"

echo "=== SwissMAT — Deploying to NUC staging ==="

# Check NUC connectivity
echo "Checking NUC connectivity..."
if ! ssh -o ConnectTimeout=5 "$NUC_HOST" "echo ok" &>/dev/null; then
    echo "ERROR: Cannot reach NUC. Check VPN/network."
    exit 1
fi

# Ensure remote directory exists
echo "Preparing remote directory..."
ssh "$NUC_HOST" "mkdir -p $NUC_PATH"

# Rsync project files
echo "Syncing files..."
rsync -avz --delete \
    --exclude='.git' \
    --exclude='.DS_Store' \
    --exclude='extracted_images' \
    --exclude='*.pptx' \
    --exclude='*.pdf' \
    "$LOCAL_PATH/" "$NUC_HOST:$NUC_PATH/"

# Build and restart containers
echo "Restarting containers..."
ssh "$NUC_HOST" "cd $NUC_PATH && docker compose up -d --build"

echo ""
echo "=== Deployment complete ==="
echo "Staging URL: http://192.168.1.23:8140"
echo ""
