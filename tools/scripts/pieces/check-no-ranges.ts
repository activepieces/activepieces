import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PIECES_ROOT = join(process.cwd(), 'packages', 'pieces')

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
  const packageJsonPaths = findAllPiecePackageJsons()
  const violations: string[] = []

  for (const filePath of packageJsonPaths) {
    const json = JSON.parse(readFileSync(filePath, 'utf-8'))

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
          violations.push(`${json.name} -> ${field}.${name}: ${version} (${filePath})`)
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error(`Found ${violations.length} dependency version range(s) that must be pinned to exact versions:\n`)
    for (const v of violations) {
      console.error(`  ${v}`)
    }
    console.error('\nRun: npm run pin-dependency-versions')
    process.exit(1)
  }

  console.info(`[check-no-ranges] All ${packageJsonPaths.length} piece package.json files use exact dependency versions.`)
}

main()
