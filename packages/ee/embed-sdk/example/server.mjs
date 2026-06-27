// Zero-dependency host for the embed showcase. Mints embedding JWTs with the
// platform signing key and serves the locally built SDK bundle so the page
// exercises *this* repo's embed code, not the CDN.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const EXAMPLE_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(EXAMPLE_DIR, '../../../..')
const SDK_DIR = path.resolve(EXAMPLE_DIR, '..')
const SDK_BUNDLE = path.join(REPO_ROOT, 'dist/packages/ee/embed-sdk/bundled.js')
const CONFIG_PATH = path.join(EXAMPLE_DIR, '.embed-config.json')
const PUBLIC_DIR = path.join(EXAMPLE_DIR, 'public')
const PORT = Number(process.env.PORT || 4400)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.map': 'application/json; charset=utf-8',
}

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`\n  No .embed-config.json found.\n  Run the one-time setup first:\n\n    node setup.mjs --instance http://localhost:4210 --email you@acme.com --password ****\n`)
    process.exit(1)
  }
  const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
  for (const key of ['instanceUrl', 'signingKeyId', 'privateKey']) {
    if (!cfg[key]) {
      console.error(`  .embed-config.json is missing "${key}". Re-run setup.mjs.`)
      process.exit(1)
    }
  }
  return cfg
}

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}

function signJwt({ payload, privateKey, kid }) {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid }))
  const body = base64url(JSON.stringify(payload))
  const signingInput = `${header}.${body}`
  const signature = crypto.createSign('RSA-SHA256').update(signingInput).end().sign(privateKey).toString('base64url')
  return `${signingInput}.${signature}`
}

function mintToken({ config, overrides }) {
  const now = Math.floor(Date.now() / 1000)
  const u = { ...config.user, ...overrides }
  const payload = {
    version: 'v3',
    externalUserId: u.externalUserId,
    externalProjectId: u.externalProjectId,
    projectDisplayName: u.projectDisplayName,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    piecesFilterType: u.piecesFilterType ?? 'NONE',
    ...(u.piecesTags ? { piecesTags: u.piecesTags } : {}),
    tasks: u.tasks ?? 50000,
    aiCredits: u.aiCredits ?? 250,
    exp: now + 60 * 10,
  }
  return signJwt({ payload, privateKey: config.privateKey, kid: config.signingKeyId })
}

function ensureBundle() {
  if (existsSync(SDK_BUNDLE)) return true
  console.log('  SDK bundle not found — building it (npm run bundle in embed-sdk)...')
  const res = spawnSync('npm', ['run', 'bundle'], { cwd: SDK_DIR, stdio: 'inherit' })
  return res.status === 0 && existsSync(SDK_BUNDLE)
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return {}
  }
}

function send(res, status, body, contentType = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType })
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body))
}

async function serveStatic(res, urlPath) {
  const rel = urlPath === '/' ? '/index.html' : urlPath
  const filePath = path.join(PUBLIC_DIR, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''))
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, 'Forbidden', 'text/plain')
  try {
    const info = await stat(filePath)
    if (!info.isFile()) return send(res, 404, 'Not found', 'text/plain')
    const data = await readFile(filePath)
    return send(res, 200, data, MIME[path.extname(filePath)] ?? 'application/octet-stream')
  } catch {
    return send(res, 404, 'Not found', 'text/plain')
  }
}

const config = loadConfig()
if (!ensureBundle()) {
  console.warn('  Could not build the SDK bundle. Run `npm run bundle` inside packages/ee/embed-sdk and restart.')
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  if (url.pathname === '/api/config') {
    return send(res, 200, {
      instanceUrl: config.instanceUrl,
      prefix: config.prefix ?? '/automations',
      user: { ...config.user, privateKey: undefined },
    })
  }

  if (url.pathname === '/api/token' && req.method === 'POST') {
    const overrides = await readBody(req)
    try {
      const token = mintToken({ config, overrides })
      return send(res, 200, { token, instanceUrl: config.instanceUrl, prefix: config.prefix ?? '/automations' })
    } catch (error) {
      return send(res, 500, { error: error instanceof Error ? error.message : String(error) })
    }
  }

  if (url.pathname === '/sdk.js') {
    try {
      const data = await readFile(SDK_BUNDLE)
      return send(res, 200, data, MIME['.js'])
    } catch {
      return send(res, 503, '// SDK bundle missing — run `npm run bundle` in packages/ee/embed-sdk', MIME['.js'])
    }
  }

  if (url.pathname === '/sdk.js.map') {
    try {
      const data = await readFile(`${SDK_BUNDLE}.map`)
      return send(res, 200, data, MIME['.map'])
    } catch {
      return send(res, 404, '{}', MIME['.map'])
    }
  }

  return serveStatic(res, url.pathname)
})

server.listen(PORT, () => {
  console.log(`\n  Embed showcase running:  http://localhost:${PORT}`)
  console.log(`  Activepieces instance:   ${config.instanceUrl}`)
  console.log(`  Signing key:             ${config.signingKeyId}\n`)
})
