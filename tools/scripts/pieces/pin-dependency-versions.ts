import { readFileSync, writeFileSync } from 'node:fs'
import { parseBunLock } from '../../../packages/cli/src/lib/utils/prepare-piece-utils'
import { findAllPiecePackageJsons } from '../utils/piece-package-utils'

function stripRange(version: string): string {
  return version.replace(/^[\^~>=<]+/, '')
}

function pinDepsInPackageJson({ filePath, resolvedVersions }: { filePath: string, resolvedVersions: Map<string, string> }): number {
  const raw = readFileSync(filePath, 'utf-8')
  const json = JSON.parse(raw)
  let pinCount = 0

  for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
    const deps: Record<string, string> | undefined = json[field]
    if (!deps) {
      continue
    }
    for (const [name, version] of Object.entries(deps)) {
      if (version.startsWith('workspace:')) {
        continue
      }
      if (/^[\^~>=<]/.test(version)) {
        const stripped = stripRange(version)
        const lockVersion = resolvedVersions.get(name)
        const pinned = lockVersion ?? stripped
        deps[name] = pinned
        pinCount++
      }
    }
  }

  if (pinCount > 0) {
    writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n')
  }
  return pinCount
}

function main(): void {
  const { resolvedVersions } = parseBunLock(process.cwd())
  console.info(`[pin-dependency-versions] parsed ${resolvedVersions.size} resolved versions from bun.lock`)

  const packageJsonPaths = findAllPiecePackageJsons()
  console.info(`[pin-dependency-versions] found ${packageJsonPaths.length} piece package.json files`)

  let totalPinned = 0
  let filesChanged = 0

  for (const filePath of packageJsonPaths) {
    const pinned = pinDepsInPackageJson({ filePath, resolvedVersions })
    if (pinned > 0) {
      totalPinned += pinned
      filesChanged++
      console.info(`  pinned ${pinned} deps in ${filePath}`)
    }
  }

  console.info(`[pin-dependency-versions] done — pinned ${totalPinned} dependencies across ${filesChanged} files`)
}

main()
