#!/bin/bash

# Ensure the node_modules are installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the project
echo "Building the project..."
npm run build

# Run in production mode
echo "Starting server in production mode..."
npm start
