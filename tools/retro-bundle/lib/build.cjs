// Hardened Path-2 builder. Takes a PUBLISHED npm version, installs its OWN pinned deps (incl. its
// old framework), and esbuild-inlines them into one self-contained tarball — equivalence by
// construction. Hardens the prototype against the four confirmed failure classes:
//   1. peer-dep conflicts in old manifests  -> npm install --legacy-peer-deps
//   2. asset-loader deps (.wasm/.proto/fork) -> detect + externalize+pin (so the asset still ships)
//   3. floating '*' externals               -> pin every external to its exact installed version
//   4. oversized inline (>5MB)               -> fall back to external-by-default
const esbuild = require('esbuild')
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { builtinModules, createRequire } = require('node:module')
const { detectAssetLoaders } = require('./asset-detector.cjs')

async function buildBundle({ name, version, workDir, forceExternal = [], log = () => {} }) {
  const root = path.join(workDir, `${name.replace('/', '-')}-${version}`)
  fs.rmSync(root, { recursive: true, force: true })
  const pkgDir = path.join(root, 'pkg')
  fs.mkdirSync(pkgDir, { recursive: true })
  const nodeModulesDir = path.join(pkgDir, 'node_modules')

  log(`[1] npm pack ${name}@${version}`)
  const tgz = sh(`npm pack ${name}@${version} --silent`, root).split('\n').pop().trim()
  sh(`tar -xzf ${tgz} -C pkg --strip-components=1`, root)
  const origManifest = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
  const entryRel = (origManifest.main ?? 'src/index.js').replace(/^\.\//, '')
  const entry = path.join(pkgDir, entryRel)

  // The OLDEST pieces (pre framework rename) declare @activepieces/framework + shared + tslib as
  // PEERS. npm won't auto-install peers under --legacy-peer-deps, and a separate `npm install <peer>`
  // crashes on this npm version — so merge peers into dependencies (pinned) before a single install.
  // esbuild then inlines that version's OWN framework => equivalence preserved.
  const hadPeers = origManifest.peerDependencies && Object.keys(origManifest.peerDependencies).length > 0
  if (hadPeers) {
    const merged = { ...origManifest, dependencies: { ...(origManifest.dependencies || {}), ...origManifest.peerDependencies } }
    delete merged.peerDependencies
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(merged, null, 2))
  }
  log(`[2] npm install --omit=dev --legacy-peer-deps${hadPeers ? ' (peers merged into deps)' : ''}`)
  sh('npm install --omit=dev --no-audit --no-fund --legacy-peer-deps --silent', pkgDir)
  const installedFrameworkVersion = readDepVersion(nodeModulesDir, '@activepieces/pieces-framework')
    || readDepVersion(nodeModulesDir, '@activepieces/framework')

  log('[3] pass-1 esbuild (inline all, externalize known natives)')
  // .cjs (not .js): the assembled bundle is CommonJS, and some pieces ship package.json
  // "type":"module" — a .js there would be treated as ESM and break the require() in
  // enumerateExportNames (and the engine's CJS interop). .cjs forces CommonJS regardless.
  const outfile = path.join(pkgDir, '__bundle.cjs')
  // Heal loop: a dependency can itself require a TRANSITIVE peer dep that npm won't auto-install
  // (e.g. @activepieces/shared peer-requires dayjs). esbuild surfaces these as "Could not resolve X".
  // Discover them from the error, install pinned to the requiring package's declared range, retry.
  let pass
  const healed = []
  for (let attempt = 0; ; attempt++) {
    try {
      pass = await runEsbuild({ entry, outfile, external: NATIVE_EXTERNALS })
      break
    }
    catch (e) {
      const missing = parseUnresolved(e.message)
      if (missing.length === 0 || attempt >= 3) {
        throw e
      }
      log(`[3.heal${attempt}] install missing transitive deps: ${missing.map((m) => m.pkg).join(', ')}`)
      healMissing({ pkgDir, nodeModulesDir, missing })
      healed.push(...missing.map((m) => m.pkg))
    }
  }

  log('[4] compute externalize set (natives + hazards + asset-loaders + forced)')
  const inlinedPkgs = inlinedTopLevelPkgs(pass.metafile)
  const unsafe = detectUnsafe(pass)
  const assetFlagged = detectAssetLoaders({ inlinedPkgs, nodeModulesDir })
  const externalize = new Set([
    ...NATIVE_EXTERNALS,
    ...unsafe,
    ...assetFlagged.map((a) => a.pkg),
    ...forceExternal,
  ])

  if (unsafe.size || assetFlagged.length || forceExternal.length) {
    log(`[5] pass-2 esbuild (externalizing ${[...unsafe, ...assetFlagged.map((a) => a.pkg), ...forceExternal].join(', ') || '—'})`)
    pass = await runEsbuild({ entry, outfile, external: externalize })
  }

  let sizeFallback = false
  let gateIssues = gateBundle(pass)
  if (statBytes(outfile) > FAIL_BYTES && gateIssues.length === 0) {
    log('[5b] over 5MB — external-by-default fallback')
    sizeFallback = true
    pass = await runEsbuild({ entry, outfile, external: externalize, externalAll: true })
    gateIssues = gateBundle(pass)
  }
  if (gateIssues.length > 0) {
    return fail(root, name, version, `safety gate: ${gateIssues.join('; ')}`)
  }

  log('[6] assemble dist with PINNED externals')
  const residual = externalsInOutput(pass.metafile)
  const deps = {}
  const droppedOptional = []
  for (const dep of residual) {
    const v = resolveInstalledVersion({ pkgDir, nodeModulesDir, pkg: dep })
    if (v) {
      deps[dep] = v // EXACT version — never '*'
    }
    else {
      // esbuild left this external but it isn't installed anywhere = an OPTIONAL require the original
      // ran without (e.g. node-fetch's `encoding`, debug's `supports-color` inside a try/catch).
      // Dropping it preserves behavior; the gate confirms the bundle still loads. Never emit '*'.
      droppedOptional.push(dep)
    }
  }

  const dist = path.join(root, 'dist')
  fs.mkdirSync(path.join(dist, 'src'), { recursive: true })
  fs.copyFileSync(outfile, path.join(dist, 'src', 'bundle.cjs'))
  const i18nSrc = path.join(pkgDir, 'src', 'i18n')
  if (fs.existsSync(i18nSrc)) {
    fs.cpSync(i18nSrc, path.join(dist, 'src', 'i18n'), { recursive: true })
  }

  // The engine loads pieces with `await import()`. A CJS bundle imported as ESM exposes its members
  // only under `.default`, but the engine's extractPieceFromModule scans the TOP level for a value
  // whose constructor.name === 'Piece' — so a bare CJS bundle fails to load. Emit an ESM wrapper that
  // re-exports the bundle's members BY NAME, surfacing the Piece at the top level. Names are read
  // from the assembled bundle (externals resolve from pkgDir/node_modules, same as the gate).
  log('[6b] emit ESM re-export wrapper (engine loads via import())')
  const exportedNames = enumerateExportNames(outfile)
  const wrapperLines = [
    'import _b from \'./bundle.cjs\'',
    'export default _b',
    ...exportedNames.map((k) => `export const ${k} = _b[${JSON.stringify(k)}]`),
  ]
  fs.writeFileSync(path.join(dist, 'src', 'index.mjs'), wrapperLines.join('\n') + '\n')

  const manifest = {
    name: origManifest.name,
    version: origManifest.version,
    main: './src/index.mjs',
    files: ['src/index.mjs', 'src/bundle.cjs', 'package.json', 'src/i18n'],
    ...(Object.keys(deps).length ? { dependencies: deps } : {}),
  }
  fs.writeFileSync(path.join(dist, 'package.json'), JSON.stringify(manifest, null, 2))

  log('[7] npm pack')
  const finalTgz = sh('npm pack . --silent', dist).split('\n').pop().trim()
  const tarballPath = path.join(dist, finalTgz)
  const bundleBytes = statBytes(tarballPath)

  return {
    ok: true,
    name,
    version,
    bundleBytes,
    underGate: bundleBytes < FAIL_BYTES,
    installedFrameworkVersion,
    externalizedDeps: deps,
    droppedOptionalDeps: droppedOptional,
    healedTransitiveDeps: healed,
    assetExternalized: assetFlagged,
    sizeFallback,
    tarballPath,
    distDir: dist,
    root,
  }
}

function fail(root, name, version, reason) {
  return { ok: false, name, version, error: reason, root }
}

// Read the assembled bundle's named exports by requiring it (externals resolve from the adjacent
// node_modules). Used to generate the ESM wrapper. Returns valid-identifier keys only; a bundle that
// exports a bare value (module.exports = piece) yields no names and relies on the default export.
function enumerateExportNames(bundleFile) {
  const mod = require(bundleFile)
  if (mod === null || typeof mod !== 'object') {
    return []
  }
  return Object.keys(mod).filter((k) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) && k !== 'default')
}

async function runEsbuild({ entry, outfile, external, externalAll = false }) {
  const plugins = externalAll ? [externalizeAllThirdParty(external)] : []
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile,
    minify: true,
    keepNames: true, // engine finds the piece via constructor.name === 'Piece'; minify would mangle it
    treeShaking: true,
    metafile: true,
    allowOverwrite: true,
    logLevel: 'silent',
    external: externalAll ? undefined : [...external],
    loader: { '.node': 'file' },
    plugins,
  })
  return { result, metafile: result.metafile, warnings: result.warnings }
}

// External-by-default plugin (size fallback): keep @activepieces/* + relative inlined, externalize
// every other bare third-party specifier so they install at runtime and the bundle stays lean.
function externalizeAllThirdParty(keepExternal) {
  return {
    name: 'externalize-all-third-party',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'entry-point') return null
        const id = args.path
        if (id.startsWith('.') || path.isAbsolute(id)) return null
        if (id.startsWith('@activepieces/')) return null
        if (id.startsWith('node:') || NODE_BUILTINS.has(id)) return { path: id, external: true }
        return { path: id, external: true }
      })
    },
  }
}

function inlinedTopLevelPkgs(metafile) {
  const set = new Set()
  for (const input of Object.keys(metafile.inputs)) {
    const pkg = pkgOfInput(input)
    if (pkg) set.add(pkg)
  }
  return set
}

function detectUnsafe({ metafile, warnings }) {
  const set = new Set()
  for (const input of Object.keys(metafile.inputs)) {
    if (input.endsWith('.node')) {
      const p = pkgOfInput(input)
      if (p) set.add(p)
    }
  }
  for (const w of warnings) {
    if (HAZARD_IDS.has(w.id) && w.location?.file) {
      const p = pkgOfInput(w.location.file)
      if (p) set.add(p)
    }
  }
  return set
}

function gateBundle({ metafile, warnings }) {
  const issues = []
  const inputs = Object.keys(metafile.inputs)
  for (const input of inputs) {
    if (input.endsWith('.node')) issues.push(`native addon inlined: ${input}`)
  }
  const inlinedPkgs = new Set(inputs.map(pkgOfInput).filter(Boolean))
  for (const pkg of inlinedPkgs) {
    if (NATIVE_EXTERNALS.has(pkg)) issues.push(`known-native package inlined: ${pkg}`)
  }
  for (const w of warnings) {
    if (HAZARD_IDS.has(w.id)) issues.push(`${w.text}`)
  }
  return issues
}

function externalsInOutput(metafile) {
  const set = new Set()
  for (const out of Object.values(metafile.outputs || {})) {
    for (const imp of out.imports || []) {
      if (imp.external
        && !imp.path.startsWith('.')
        && !path.isAbsolute(imp.path)
        && !NODE_BUILTINS.has(imp.path)
        && !imp.path.startsWith('node:')) {
        set.add(topLevelPkg(imp.path))
      }
    }
  }
  return [...set]
}

// Parse esbuild "Could not resolve" errors into [{ pkg, fromPkg }] (deduped by pkg). fromPkg is the
// node_modules package whose file raised the error (so we can read the version range it declares).
function parseUnresolved(msg) {
  const byPkg = new Map()
  const re = /(?:node_modules\/((?:@[^/]+\/[^/]+)|[^/]+)\/)?[^\n]*?:\d+:\d+: ERROR: Could not resolve "([^"]+)"/g
  for (const m of msg.matchAll(re)) {
    const fromPkg = m[1] || null
    const id = m[2]
    if (id.startsWith('.') || isAbsolutePath(id) || id.startsWith('node:') || NODE_BUILTINS.has(id)) {
      continue
    }
    const pkg = topLevelPkg(id)
    if (!byPkg.has(pkg)) {
      byPkg.set(pkg, { pkg, fromPkg })
    }
  }
  return [...byPkg.values()]
}

function isAbsolutePath(p) {
  return p.startsWith('/') || /^[A-Za-z]:[\\/]/.test(p)
}

// Install missing transitive deps by MERGING them into the root manifest's dependencies (a separate
// `npm install <spec>` crashes on this npm version) at the range the requiring package declares,
// then reinstalling. The merge makes them direct deps so --legacy-peer-deps installs them.
function healMissing({ pkgDir, nodeModulesDir, missing }) {
  const pkgJsonPath = path.join(pkgDir, 'package.json')
  const manifest = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
  manifest.dependencies = manifest.dependencies || {}
  for (const { pkg, fromPkg } of missing) {
    manifest.dependencies[pkg] = declaredRange({ nodeModulesDir, fromPkg, pkg }) || 'latest'
  }
  fs.writeFileSync(pkgJsonPath, JSON.stringify(manifest, null, 2))
  sh('npm install --omit=dev --no-audit --no-fund --legacy-peer-deps --silent', pkgDir)
}

// The version range the requiring package declares for the missing dep (deps/peers/optional).
function declaredRange({ nodeModulesDir, fromPkg, pkg }) {
  if (!fromPkg) {
    return null
  }
  try {
    const man = JSON.parse(fs.readFileSync(path.join(nodeModulesDir, ...fromPkg.split('/'), 'package.json'), 'utf-8'))
    return (man.dependencies && man.dependencies[pkg])
      || (man.peerDependencies && man.peerDependencies[pkg])
      || (man.optionalDependencies && man.optionalDependencies[pkg])
      || null
  }
  catch {
    return null
  }
}

function readDepVersion(nodeModulesDir, pkg) {
  try {
    return JSON.parse(fs.readFileSync(path.join(nodeModulesDir, ...pkg.split('/'), 'package.json'), 'utf8')).version
  }
  catch {
    return null
  }
}

// Find the EXACT installed version of an external, wherever npm placed it: top-level, via Node
// resolution from the piece, or nested under another package's node_modules. Returns null only when
// the package isn't installed at all (an optional require the original ran without).
function resolveInstalledVersion({ pkgDir, nodeModulesDir, pkg }) {
  const top = readDepVersion(nodeModulesDir, pkg)
  if (top) {
    return top
  }
  try {
    const req = createRequire(path.join(pkgDir, 'package.json'))
    return JSON.parse(fs.readFileSync(req.resolve(`${pkg}/package.json`), 'utf8')).version
  }
  catch { /* fall through to filesystem search */ }
  return findNestedVersion(nodeModulesDir, pkg)
}

function findNestedVersion(nodeModulesDir, pkg) {
  const rel = path.join(...pkg.split('/'), 'package.json')
  const stack = [nodeModulesDir]
  while (stack.length > 0) {
    const dir = stack.pop()
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8')).version
    }
    catch { /* not here — descend into nested node_modules */ }
    let entries = []
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    }
    catch { continue }
    for (const e of entries) {
      if (!e.isDirectory()) {
        continue
      }
      const nested = path.join(dir, e.name, 'node_modules')
      if (fs.existsSync(nested)) {
        stack.push(nested)
      }
    }
  }
  return null
}

function pkgOfInput(input) {
  const marker = 'node_modules/'
  const i = input.lastIndexOf(marker)
  if (i === -1) return null
  return topLevelPkg(input.slice(i + marker.length))
}

function topLevelPkg(id) {
  if (id.startsWith('@')) {
    const [scope, n] = id.split('/')
    return n ? `${scope}/${n}` : scope
  }
  return id.split('/')[0]
}

function sh(cmd, cwd) {
  return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim()
}
function statBytes(f) {
  return fs.statSync(f).size
}

const FAIL_BYTES = 5 * 1024 * 1024
const NODE_BUILTINS = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)])
const HAZARD_IDS = new Set([
  'indirect-require', 'unsupported-require-call', 'unsupported-dynamic-import',
  'require-resolve-not-external', 'import-is-undefined', 'call-import-namespace',
  'commonjs-variable-in-esm',
])
// Mirrors packages/cli/src/lib/utils/bundle-piece-utils.ts NATIVE_EXTERNALS, plus packages whose
// native binding is loaded via a RELATIVE path (e.g. ssh2's crypto/build/Release/sshcrypto.node):
// esbuild inlines their JS but cannot inline the .node, so they must be externalized + pinned and
// brought in by the runtime install instead of stranded as a dangling relative require.
const NATIVE_EXTERNALS = new Set([
  'oracledb', 'duckdb', '@duckdb/node-api', '@duckdb/node-bindings',
  'better-sqlite3', 'sqlite3', 'cpu-features',
  'pg-native', 'mongodb-client-encryption', 'kerberos',
  'snappy', 'aws4', 'bson-ext', '@mongodb-js/zstd',
  'playwright', 'playwright-core', 'puppeteer', 'puppeteer-core',
  'ssh2', 'ssh2-sftp-client',
])

module.exports = { buildBundle, FAIL_BYTES }
