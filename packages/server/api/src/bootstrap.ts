/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
// Uses require() instead of import to prevent hoisting, ensuring dotenv
// populates process.env before any module-level code reads it.
const path = require('path')
const fs = require('fs')

// Always load the project root `.env` (based on current working directory).
// This avoids fragile `__dirname`-relative paths when running from `dist/` or other directories.
const envPath = path.resolve(process.cwd(), '.env')
if (!fs.existsSync(envPath)) {
    throw new Error(`.env file not found at: ${envPath}`)
}

const dotenvResult = require('dotenv').config({ path: envPath })
if (dotenvResult.error) {
    throw dotenvResult.error
}
require('./main')
