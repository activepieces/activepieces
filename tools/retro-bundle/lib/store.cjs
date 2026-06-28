// Storage abstraction for retro-bundle artifacts.
// Two backends, identical interface, selected by config:
//   - local: a filesystem directory that mirrors the S3 key layout (pieces/<name-dashed>-<ver>.tgz).
//            This is what lets the whole pipeline run/test WITHOUT a live S3 bucket.
//   - s3:    shells out to the `aws` CLI (no SDK dependency), targeting the same bucket/endpoint
//            the engine reads. Key formula is byte-identical to the engine's pieceBundleS3Key.
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

// Engine's key formula (verified piece-bundle.ts:80): only the FIRST '/' is replaced (scoped name).
function bundleKey({ name, version }) {
  return `${S3_PIECES_PREFIX}${name.replace('/', '-')}-${version}.tgz`
}

function makeStore(opts) {
  if (opts.backend === 'local') {
    return localStore(opts.localDir)
  }
  if (opts.backend === 's3') {
    return s3Store(opts)
  }
  throw new Error(`[store] unknown backend: ${opts.backend}`)
}

function localStore(localDir) {
  const root = path.resolve(localDir)
  const full = (key) => path.join(root, key)
  return {
    backend: 'local',
    describe: () => `local:${root}`,
    async head(key) {
      return fs.existsSync(full(key))
    },
    async put(key, filePath) {
      const dest = full(key)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(filePath, dest)
      return { key, bytes: fs.statSync(dest).size }
    },
    async get(key, destPath) {
      const src = full(key)
      if (!fs.existsSync(src)) {
        throw new Error(`[store.local] not found: ${key}`)
      }
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      fs.copyFileSync(src, destPath)
      return destPath
    },
    async del(key) {
      fs.rmSync(full(key), { force: true })
    },
    async list(prefix = S3_PIECES_PREFIX) {
      const dir = full(prefix)
      if (!fs.existsSync(dir)) {
        return []
      }
      return fs.readdirSync(dir).map((f) => `${prefix}${f}`)
    },
  }
}

function s3Store({ bucket, endpoint, region }) {
  const base = ['--bucket', bucket]
  if (endpoint) {
    base.push('--endpoint-url', endpoint)
  }
  const env = { ...process.env, ...(region ? { AWS_REGION: region } : {}) }
  const run = (args) => execFileSync('aws', args, { env, stdio: ['ignore', 'pipe', 'pipe'] }).toString()
  return {
    backend: 's3',
    describe: () => `s3:${bucket}${endpoint ? ` @ ${endpoint}` : ''}`,
    async head(key) {
      try {
        run(['s3api', 'head-object', ...base, '--key', key])
        return true
      }
      catch {
        return false
      }
    },
    async put(key, filePath) {
      run(['s3api', 'put-object', ...base, '--key', key, '--body', filePath])
      return { key, bytes: fs.statSync(filePath).size }
    },
    async get(key, destPath) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      run(['s3api', 'get-object', ...base, '--key', key, destPath])
      return destPath
    },
    async del(key) {
      run(['s3api', 'delete-object', ...base, '--key', key])
    },
    async list(prefix = S3_PIECES_PREFIX) {
      const out = run(['s3api', 'list-objects-v2', ...base, '--prefix', prefix, '--query', 'Contents[].Key', '--output', 'text'])
      return out.split(/\s+/).filter(Boolean)
    },
  }
}

const S3_PIECES_PREFIX = 'pieces/retro/'

module.exports = { makeStore, bundleKey, S3_PIECES_PREFIX }
