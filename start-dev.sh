#!/bin/bash
unset NODE_OPTIONS
echo "Installing dependencies..."
npm install
echo "Starting development server..."
npm run dev:backend
