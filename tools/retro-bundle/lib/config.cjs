// Resolves runtime config from env + CLI flags. The store backend defaults to `local` (filesystem)
// so the whole pipeline runs/tests WITHOUT a live S3 bucket; set RETRO_STORE=s3 (+ S3_BUCKET etc.)
// to target the real bucket the engine reads.
const path = require('node:path')
const fs = require('node:fs')

const TOOL_DIR = path.resolve(__dirname, '..') // tools/retro-bundle

function resolveConfig(argv = {}) {
  const backend = argv.store || process.env.RETRO_STORE || (process.env.S3_BUCKET ? 's3' : 'local')
  const localDir = path.resolve(argv.localDir || process.env.RETRO_LOCAL_DIR || path.join(TOOL_DIR, '.local-s3'))
  const workDir = path.resolve(process.env.RETRO_WORK_DIR || path.join(TOOL_DIR, '.work'))
  const gateDir = path.resolve(process.env.RETRO_GATE_DIR || path.join(TOOL_DIR, '.gate'))
  fs.mkdirSync(workDir, { recursive: true })
  fs.mkdirSync(gateDir, { recursive: true })
  return {
    store: {
      backend,
      localDir,
      bucket: process.env.S3_BUCKET,
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION,
    },
    csvPath: path.resolve(argv.csv || process.env.RETRO_CSV || path.join(TOOL_DIR, 'targets', 'publish-targets.json')),
    ledgerPath: path.resolve(argv.ledger || process.env.RETRO_LEDGER || path.join(TOOL_DIR, 'retro-state.jsonl')),
    workDir,
    gateDir,
  }
}

// Pieces known to load runtime assets / fork siblings. NOT a skip-list — the asset-detector and gate
// classify empirically. This is only for extra logging/scrutiny and the rollout doc.
const KNOWN_TRICKY = new Set([
  '@activepieces/piece-openai', '@activepieces/piece-azure-openai',
  '@activepieces/piece-oracle-database', '@activepieces/piece-clarifai',
])

module.exports = { resolveConfig, KNOWN_TRICKY, TOOL_DIR }
