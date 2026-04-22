import path from 'path'
import dotenv from 'dotenv'

const resolvedPath = path.resolve(__dirname, '.env.tests')
dotenv.config({ path: resolvedPath })
// Increase webhook timeout for E2E tests that exercise the sync webhook route with subflow chains.
// Must be set before modules load since WEBHOOK_TIMEOUT_MS is a module-level constant.
process.env.AP_WEBHOOK_TIMEOUT_SECONDS = '120'
console.log('Configuring vitest ' + resolvedPath)
