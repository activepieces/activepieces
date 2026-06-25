// Asset-loader detector — the one genuinely new component over the prototype.
//
// esbuild inlines JS only. A dependency that loads a NON-JS asset at runtime (a .wasm tokenizer,
// a .proto descriptor, a forked sibling script) gets its JS inlined but its asset silently dropped,
// producing a bundle that is smaller but BREAKS at runtime — and slips every static gate (no esbuild
// warning, not a .node addon, under the size cap). Confirmed: openai/azure-openai (tiktoken_bg.wasm),
// oracle-database (fork(oracle-runner.js)), clarifai (gRPC/.proto).
//
// Given the set of top-level packages esbuild INLINED, scan each one's installed files for asset-load
// signatures. Any hit is returned so the builder can EXTERNALIZE+PIN it instead (so the published
// tarball ships the asset via a normal runtime install).
const fs = require('node:fs')
const path = require('node:path')

const ASSET_EXTS = new Set(['.wasm', '.proto', '.node', '.data', '.bin', '.onnx'])
const SOURCE_EXTS = new Set(['.js', '.cjs', '.mjs'])
// Source patterns that imply a runtime read of an on-disk sibling the bundle won't carry.
const SIGNATURE_RES = [
  /readFileSync\s*\([^)]*__dirname/,
  /readFile\s*\([^)]*__dirname/,
  /createReadStream\s*\([^)]*__dirname/,
  /\b(?:fork|execFile|spawn)\s*\([^)]*__dirname/,
  // dynamic sibling require/import esbuild can't inline (e.g. pg-format: require(__dirname+"/reserved.js")).
  // Externalizing the dep ships its sibling files so the runtime require resolves.
  /\brequire\s*\([^)]*__dirname/,
  /\bimport\s*\([^)]*__dirname/,
  /__dirname[^\n;]{0,80}\.(?:wasm|proto|node|data|bin|onnx)\b/,
  /\.(?:wasm|proto)['"]\s*\)/,
]

function detectAssetLoaders({ inlinedPkgs, nodeModulesDir }) {
  const flagged = []
  for (const pkg of inlinedPkgs) {
    const dir = pkgDir(nodeModulesDir, pkg)
    if (!dir || !fs.existsSync(dir)) {
      continue
    }
    const reason = scanPackage(dir)
    if (reason) {
      flagged.push({ pkg, reason, version: readVersion(dir) })
    }
  }
  return flagged
}

function pkgDir(nodeModulesDir, pkg) {
  return path.join(nodeModulesDir, ...pkg.split('/'))
}

function readVersion(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version || null
  }
  catch {
    return null
  }
}

// Returns a human reason string if the package looks like it loads a runtime asset, else null.
function scanPackage(dir) {
  let assetFile = null
  let sourceHit = null
  walk(dir, (file) => {
    const ext = path.extname(file).toLowerCase()
    if (ASSET_EXTS.has(ext)) {
      assetFile = assetFile || path.relative(dir, file)
      return
    }
    if (SOURCE_EXTS.has(ext) && sourceHit === null) {
      let text
      try {
        text = fs.readFileSync(file, 'utf8')
      }
      catch {
        return
      }
      // skip enormous minified files cheaply only if no asset already found
      for (const re of SIGNATURE_RES) {
        if (re.test(text)) {
          sourceHit = `${path.relative(dir, file)} matches ${re}`
          break
        }
      }
    }
  })
  if (assetFile && sourceHit) {
    return `ships ${assetFile} and reads it at runtime (${sourceHit})`
  }
  if (assetFile) {
    return `ships non-JS asset ${assetFile} (would be dropped if inlined)`
  }
  if (sourceHit) {
    return `runtime asset/sibling read: ${sourceHit}`
  }
  return null
}

function walk(dir, onFile, depth = 0) {
  if (depth > 6) {
    return
  }
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  }
  catch {
    return
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.bin') {
      continue
    }
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      walk(full, onFile, depth + 1)
    }
    else if (e.isFile()) {
      onFile(full)
    }
  }
}

// Static backstop scan of a FINAL assembled bundle (single src/index.js) for the ONE failure the
// gate's standalone-load test cannot see: a RUN-TIME fork/exec/spawn of a __dirname-relative sibling
// script that won't exist in a one-file bundle (e.g. oracle-database's oracle-runner.js).
//
// We deliberately do NOT flag bare ".wasm"/".proto" string references: emscripten and similar embed
// the bytes as base64 and the filename is just a label (e.g. azure crc64.wasm), and any GENUINE
// module-load asset/require failure (tiktoken_bg.wasm, pg-format reserved.js) already fails the gate's
// require() test. A bare-string scan only produced false positives.
function scanAssembledBundle({ bundleSource }) {
  const fatal = []
  if (/\b(?:fork|execFile|spawn)\s*\([^)]*__dirname/.test(bundleSource)) {
    fatal.push('forks/execs a __dirname-relative sibling script that will not exist in a single-file bundle')
  }
  return fatal
}

module.exports = { detectAssetLoaders, scanAssembledBundle }
