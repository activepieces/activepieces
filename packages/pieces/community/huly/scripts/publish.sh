#!/bin/bash

# Ensure we're on the main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "Please switch to the main branch before publishing"
  exit 1
fi

# Ensure working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Working directory is not clean. Please commit or stash changes before publishing."
  exit 1
fi

# Build the package
npm run build

# Run tests
npm test

# Set the version based on argument or prompt
if [ -n "$1" ]; then
  VERSION_TYPE=$1
else
  echo "Select version increment (patch, minor, major):"
  read VERSION_TYPE
fi

# Update version
npm version $VERSION_TYPE

# Publish to npm
npm publish

# Push changes to GitHub
git push && git push --tags

echo "Package published successfully!"
