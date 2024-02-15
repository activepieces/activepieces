#!/bin/sh

# Start Nginx server
nginx -g "daemon off;" &

# Start backend server
node --enable-source-maps dist/packages/server/api/main.js
