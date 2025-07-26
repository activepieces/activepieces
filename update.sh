#!/bin/bash

# List of JWT SSO files to preserve (relative to repo root)
SSO_FILES=(
  "packages/server/api/src/app/authentication/jwt-authn/jwt-authn-controller.ts"
  "packages/server/api/src/app/authentication/jwt-authn/jwt-authn-service.ts"
  "packages/server/api/src/app/authentication/jwt-authn/lib/jwt-token-extractor.ts"
  "packages/server/api/src/app/authentication/jwt-authn/jwt-authn-module.ts"
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

echo "Update complete. Your JWT SSO files have been preserved." 