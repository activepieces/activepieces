import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PIECES_ROOT = join(process.cwd(), 'packages', 'pieces')
const LOCK_PATH = join(process.cwd(), 'bun.lock')

function parseResolvedVersionsFromLock(): Map<string, string> {
  const raw = readFileSync(LOCK_PATH, 'utf-8').replace(/,(\s*[}\]])/g, '$1')
  const lock = JSON.parse(raw)
  const packages: Record<string, [string, ...unknown[]]> = lock.packages
  const versionMap = new Map<string, string>()

  for (const [name, entry] of Object.entries(packages)) {
    const resolved = entry[0]
    if (!resolved || resolved.includes('workspace:')) {
      continue
    }
    const atIndex = resolved.lastIndexOf('@')
    if (atIndex <= 0) {
      continue
    }
    const pkgName = resolved.slice(0, atIndex)
    const version = resolved.slice(atIndex + 1)
    if (!versionMap.has(pkgName)) {
      versionMap.set(pkgName, version)
    }
  }

  return versionMap
}

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

function findAllPiecePackageJsons(): string[] {
  const paths: string[] = []
  const dirs = ['community', 'core', 'custom']

  for (const dir of dirs) {
    const dirPath = join(PIECES_ROOT, dir)
    if (!existsSync(dirPath)) {
      continue
    }
    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const pkgPath = join(dirPath, entry.name, 'package.json')
        if (existsSync(pkgPath)) {
          paths.push(pkgPath)
        }
      }
    }
  }

  const commonPkg = join(PIECES_ROOT, 'common', 'package.json')
  if (existsSync(commonPkg)) {
    paths.push(commonPkg)
  }
  const frameworkPkg = join(PIECES_ROOT, 'framework', 'package.json')
  if (existsSync(frameworkPkg)) {
    paths.push(frameworkPkg)
  }

  return paths
}

function main(): void {
  const resolvedVersions = parseResolvedVersionsFromLock()
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
