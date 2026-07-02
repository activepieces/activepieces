// One-time setup: signs in as the platform admin, creates an embedding signing
// key, and writes .embed-config.json (private key never leaves this machine).
//
//   node setup.mjs --instance http://localhost:4210 --email you@acme.com --password ****
//
// Re-running creates a fresh signing key (the old one keeps working). If you'd
// rather not script it, create the key in Platform Settings -> Signing Keys,
// then hand-write .embed-config.json from .embed-config.example.json.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const EXAMPLE_DIR = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = path.join(EXAMPLE_DIR, '.embed-config.json')

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        out[key] = next
        i++
      } else {
        out[key] = true
      }
    }
  }
  return out
}

async function api({ instanceUrl, route, token, body }) {
  const res = await fetch(`${instanceUrl.replace(/\/$/, '')}/api/v1${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    throw new Error(`${route} -> ${res.status}: ${text.slice(0, 400)}`)
  }
  return json
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const instanceUrl = args.instance || process.env.AP_INSTANCE_URL || 'http://localhost:4210'
  const email = args.email || process.env.AP_ADMIN_EMAIL
  const password = args.password || process.env.AP_ADMIN_PASSWORD

  if (!email || !password) {
    console.error('Usage: node setup.mjs --instance <url> --email <admin email> --password <password>')
    console.error('The email/password must belong to the platform admin (the first user on a self-hosted instance).')
    process.exit(1)
  }

  console.log(`Signing in as ${email} on ${instanceUrl} ...`)
  const auth = await api({ instanceUrl, route: '/authentication/sign-in', body: { email, password } })
  if (!auth.token) {
    throw new Error(`Sign-in returned no token: ${JSON.stringify(auth).slice(0, 300)}`)
  }

  console.log('Creating embedding signing key ...')
  const key = await api({
    instanceUrl,
    route: '/signing-keys',
    token: auth.token,
    body: { displayName: 'Embed Showcase' },
  })
  if (!key.id || !key.privateKey) {
    throw new Error(`Signing-key creation returned unexpected shape: ${JSON.stringify(key).slice(0, 300)}\nIs this an EE/Cloud instance? Signing keys are an enterprise feature.`)
  }

  const config = {
    instanceUrl: instanceUrl.replace(/\/$/, ''),
    prefix: '/automations',
    signingKeyId: key.id,
    privateKey: key.privateKey,
    user: {
      externalUserId: 'helio-user-1001',
      externalProjectId: 'helio-workspace-42',
      projectDisplayName: 'Acme Corp Workspace',
      firstName: 'Dana',
      lastName: 'Operator',
      role: 'ADMIN',
      piecesFilterType: 'NONE',
      tasks: 50000,
      aiCredits: 250,
    },
  }

  writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`)
  console.log(`\nWrote ${CONFIG_PATH}`)
  console.log(`Signing key id: ${key.id}`)
  console.log('\nStart the showcase with:  node server.mjs\n')
}

main().catch((error) => {
  console.error(`\nSetup failed: ${error instanceof Error ? error.message : error}\n`)
  process.exit(1)
})
