#!/bin/bash

# Ensure the node_modules are installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run in development mode
echo "Starting server in development mode..."
npm run dev
