import { readFileSync } from 'node:fs'
import { findAllPiecePackageJsons } from '../utils/piece-package-utils'

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
