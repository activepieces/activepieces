// Production-faithful verification gate. Installs a candidate bundle EXACTLY as the worker does
// (wrapper package.json with a file:bundle.tgz dep, `bun install --ignore-scripts`, NO node_modules
// symlink), then proves it is self-contained and loads standalone, and runs the asset-flush backstop
// (static orphan-asset scan on the assembled bundle) for the asset-drop class the load test can miss.
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const { scanAssembledBundle } = require('./asset-detector.cjs')

function gateBundle({ name, version, tarballPath, gateDir }) {
  const ws = path.join(gateDir, `${name.replace('/', '-')}-${version}`)
  fs.rmSync(ws, { recursive: true, force: true })
  const pieceDir = path.join(ws, 'pieces', `${name.replace('/', '-')}-${version}`)
  fs.mkdirSync(pieceDir, { recursive: true })

  // Mirror piece-installer.ts createRootPackageJson / createPiecePackageJson shapes.
  fs.writeFileSync(path.join(ws, 'package.json'), JSON.stringify({ name: 'fast-workspace', version: '1.0.0', workspaces: ['pieces/**'] }))
  fs.copyFileSync(tarballPath, path.join(pieceDir, 'bundle.tgz'))
  fs.writeFileSync(path.join(pieceDir, 'package.json'), JSON.stringify({
    name: `${name.replace('/', '-')}-${version}`, version,
    dependencies: { [name]: 'file:./bundle.tgz' },
  }))

  let installErr = null
  try {
    execSync('bun install --ignore-scripts', { cwd: ws, stdio: ['ignore', 'pipe', 'pipe'] })
  }
  catch (e) {
    installErr = tail((e.stdout || '') + (e.stderr || ''))
  }

  // (1) Self-containment: no @activepieces/* in the tree other than the piece itself.
  const sdkLeaks = findSdkLeaks(ws, name)

  // (2) Standalone load + metadata() — NO node_modules symlink anywhere.
  let loadsStandalone = false, metadataOk = false, actionCount = null, loadError = null, installedEntry = null
  try {
    const req = createRequire(path.resolve(pieceDir, 'package.json')) // createRequire requires an absolute path
    installedEntry = req.resolve(name)
    const mod = req(installedEntry)
    const piece = Object.values(mod).find((v) => v && typeof v === 'object' && v.constructor?.name === 'Piece')
    const meta = piece?.metadata?.()
    loadsStandalone = !!piece
    metadataOk = !!meta && (!!meta.actions || !!meta.triggers)
    actionCount = meta ? Object.keys(meta.actions || {}).length : null
  }
  catch (e) {
    loadError = e.message.split('\n')[0]
  }

  // (3) Asset-flush backstop: static orphan-asset scan on the assembled bundle source.
  const assetFlush = runAssetFlush({ ws, installedEntry })

  const status = (!installErr && sdkLeaks.length === 0 && loadsStandalone && metadataOk && assetFlush.fatal.length === 0)
    ? 'PASS'
    : (assetFlush.fatal.length > 0 || /cannot find module|missing/i.test(loadError || '')) ? 'QUARANTINE' : 'FAIL'

  fs.rmSync(ws, { recursive: true, force: true })
  return { name, version, status, installErr, sdkLeaks, loadsStandalone, metadataOk, actionCount, loadError, assetFlush }
}

function findSdkLeaks(ws, name) {
  let dirs = []
  try {
    dirs = sh(`find . -type d -path '*/node_modules/@activepieces/*' -prune`, ws)
      .split('\n').filter(Boolean)
      .map((p) => '@activepieces/' + p.split('/node_modules/@activepieces/')[1].split('/')[0])
  }
  catch { /* none */ }
  return [...new Set(dirs)].filter((n) => n !== name)
}

function runAssetFlush({ ws, installedEntry }) {
  if (!installedEntry || !fs.existsSync(installedEntry)) {
    return { orphans: [], fatal: [], skipped: true }
  }
  const bundleSource = fs.readFileSync(installedEntry, 'utf8')
  const fatal = scanAssembledBundle({ bundleSource })
  return { orphans: fatal, fatal }
}

function sh(cmd, cwd) {
  return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim()
}
function tail(s) {
  return s.trim().split('\n').slice(-3).join(' | ').slice(0, 200)
}

module.exports = { gateBundle }
