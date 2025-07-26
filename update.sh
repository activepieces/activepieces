#!/bin/bash

# List of managed-authn files to preserve (relative to repo root)
SSO_FILES=(
  "packages/server/api/src/app/ee/managed-authn/managed-authn-controller.ts"
  "packages/server/api/src/app/ee/managed-authn/managed-authn-service.ts"
  "packages/server/api/src/app/ee/managed-authn/lib/external-token-extractor.ts"
  "packages/server/api/src/app/ee/managed-authn/managed-authn-module.ts"
)

# Directory to temporarily store your SSO files
BACKUP_DIR=".sso_backup"

# Ensure backup dir exists
mkdir -p "$BACKUP_DIR"

# Backup SSO files
for file in "${SSO_FILES[@]}"; do
  if [ -f "$file" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname $file)"
    cp "$file" "$BACKUP_DIR/$file"
  fi
done

# Fetch and merge from upstream
git fetch upstream
git merge upstream/main

# Restore SSO files
for file in "${SSO_FILES[@]}"; do
  if [ -f "$BACKUP_DIR/$file" ]; then
    cp "$BACKUP_DIR/$file" "$file"
  fi
done

# Clean up backup
rm -rf "$BACKUP_DIR"

echo "Update complete. Your managed-authn files have been preserved." 