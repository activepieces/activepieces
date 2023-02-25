#!/bin/sh

# Start Nginx server
nginx -g "daemon off;" &

# Start backend server
node dist/packages/backend/main.js
