#!/bin/bash

# Script to build, version, and publish Narmi piece to npm
# Usage: ./publish.sh [patch|minor|major]

set -e  # Exit on error

# Get the version bump type (default to patch)
VERSION_TYPE="${1:-patch}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PIECE_NAME="narmi"
PIECE_DIR="$(pwd)"
ROOT_DIR="$(pwd)/../../../.."

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Publishing: ${PIECE_NAME}${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if logged in to npm
echo -e "${BLUE}Checking npm authentication...${NC}"
if ! npm whoami &> /dev/null; then
  echo -e "${RED}Error: Not logged in to npm. Please run 'npm login' first.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Logged in as: $(npm whoami)${NC}"
echo ""

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${YELLOW}${CURRENT_VERSION}${NC}"

# Increment version in package.json
echo -e "${BLUE}Bumping version (${VERSION_TYPE})...${NC}"
npm version $VERSION_TYPE --no-git-tag-version

NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "New version: ${GREEN}${NEW_VERSION}${NC}"

# Build the piece
echo -e "${BLUE}Building piece...${NC}"
cd "$ROOT_DIR"
bunx nx build "pieces-${PIECE_NAME}" --skip-nx-cache

if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Build failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

# Navigate to dist folder
DIST_DIR="${ROOT_DIR}/dist/packages/pieces/custom/${PIECE_NAME}"
cd "$DIST_DIR"

# Publish to npm
echo -e "${BLUE}Publishing to npm...${NC}"
npm publish --access public

if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Publish failed${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Successfully published @vqnguyen1/piece-${PIECE_NAME}@${NEW_VERSION}${NC}"

# View on npm
NPM_URL="https://www.npmjs.com/package/@vqnguyen1/piece-${PIECE_NAME}"
echo -e "${BLUE}View on npm: ${NPM_URL}${NC}"
