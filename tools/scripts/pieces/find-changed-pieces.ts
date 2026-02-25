import { readPackageJson } from '../utils/files'
import { findAllPiecesDirectoryInSource, NON_PIECES_PACKAGES, AP_CLOUD_API_BASE } from '../utils/piece-script-utils'

const main = async () => {
  const release = (await readPackageJson('.')).version
  console.info(`[findChangedPieces] release=${release}`)

  const registry = await fetchRegistry(release)
  console.info(`[findChangedPieces] registry has ${registry.size} name@version entries`)

  const allPieceDirs = await findAllPiecesDirectoryInSource()
  const changedDirs: string[] = []
  const turboFilters: string[] = []

  for (const dir of allPieceDirs) {
    const pkg = await readPackageJson(dir)
    if (NON_PIECES_PACKAGES.includes(pkg.name)) {
      continue
    }
    const key = `${pkg.name}@${pkg.version}`
    if (!registry.has(key)) {
      changedDirs.push(dir)
      turboFilters.push(`--filter=${pkg.name}`)
      console.info(`[findChangedPieces] changed: ${key} (${dir})`)
    }
  }

  console.info(`[findChangedPieces] ${changedDirs.length} pieces not on cloud`)

  // Output for GitHub Actions
  const output = {
    count: changedDirs.length,
    dirs: changedDirs,
    turboFilter: turboFilters.join(' '),
  }
  // Print as JSON so the workflow can parse it
  console.log(`::set-output-json::${JSON.stringify(output)}`)
  // Also print dirs one per line for GITHUB_OUTPUT
  if (changedDirs.length > 0) {
    console.log(`CHANGED_DIRS:\n${changedDirs.join('\n')}`)
    console.log(`TURBO_FILTER:${turboFilters.join(' ')}`)
  }
}

async function fetchRegistry(release: string): Promise<Set<string>> {
  const url = `${AP_CLOUD_API_BASE}/pieces/registry?release=${release}&edition=ee`
  console.info(`[fetchRegistry] fetching ${url}`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch registry: ${response.status} ${response.statusText}`)
  }
  const entries: RegistryEntry[] = await response.json()
  const set = new Set<string>()
  for (const entry of entries) {
    set.add(`${entry.name}@${entry.version}`)
  }
  return set
}

main()

type RegistryEntry = {
  name: string
  version: string
}
