#!/bin/bash

# Script to build, version, and publish Gelato piece to npm
# Usage: ./publish.sh [patch|minor|major]

set -e
VERSION_TYPE="${1:-patch}"
PIECE_NAME="gelato"
ROOT_DIR="$(pwd)/../../../.."

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Publishing: ${PIECE_NAME}${NC}"

npm whoami &> /dev/null || { echo -e "${RED}Not logged in to npm${NC}"; exit 1; }

CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current: ${YELLOW}${CURRENT_VERSION}${NC}"

npm version $VERSION_TYPE --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "New: ${GREEN}${NEW_VERSION}${NC}"

cd "$ROOT_DIR" && bunx nx build "pieces-${PIECE_NAME}" --skip-nx-cache
cd "${ROOT_DIR}/dist/packages/pieces/custom/${PIECE_NAME}"
npm publish --access public

echo -e "${GREEN}✓ Published @vqnguyen1/piece-${PIECE_NAME}@${NEW_VERSION}${NC}"
