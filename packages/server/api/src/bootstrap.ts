/* eslint-disable @typescript-eslint/no-require-imports */
// Uses require() instead of import to prevent hoisting, ensuring dotenv
// populates process.env before any module-level code reads it.
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
require('./main')
