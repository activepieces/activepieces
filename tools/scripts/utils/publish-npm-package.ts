import assert from 'node:assert'
import { argv } from 'node:process'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { readPackageJson } from './files'
import { packagePrePublishChecks } from './package-pre-publish-checks'
import { buildWorkspaceVersionMap, resolveWorkspaceDependencies, stripSemverRanges } from '../../../packages/cli/src/lib/utils/workspace-utils'
import { parseBunLock, pinDependenciesFromLockfile } from '../../../packages/cli/src/lib/utils/prepare-piece-utils'

function isExactVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+/.test(version)
}

function assertNoSemverRanges(packageJsonPath: string): void {
  const json = JSON.parse(readFileSync(packageJsonPath).toString())
  const depFields = ['dependencies', 'devDependencies', 'peerDependencies'] as const
  const ranged: string[] = []

  for (const field of depFields) {
    const deps: Record<string, string> | undefined = json[field]
    if (!deps) {
      continue
    }
    for (const [name, version] of Object.entries(deps)) {
      if (!isExactVersion(version)) {
        ranged.push(`${field}.${name}: ${version}`)
      }
    }
  }

  if (ranged.length > 0) {
    throw new Error(
      `[publishPackage] refusing to publish ${json.name}@${json.version} — non-exact versions found:\n  ${ranged.join('\n  ')}`,
    )
  }
}

function assertNoUnresolvedWorkspaceDeps(packageJsonPath: string): void {
  const json = JSON.parse(readFileSync(packageJsonPath).toString())
  const depFields = ['dependencies', 'devDependencies', 'peerDependencies'] as const
  const unresolved: string[] = []

  for (const field of depFields) {
    const deps: Record<string, string> | undefined = json[field]
    if (!deps) {
      continue
    }
    for (const [name, version] of Object.entries(deps)) {
      if (version.startsWith('workspace:')) {
        unresolved.push(`${field}.${name}: ${version}`)
      }
    }
  }

  if (unresolved.length > 0) {
    throw new Error(
      `[publishPackage] refusing to publish ${json.name}@${json.version} — unresolved workspace dependencies:\n  ${unresolved.join('\n  ')}`,
    )
  }
}

export const publishNpmPackage = async (path: string): Promise<void> => {
  console.info(`[publishPackage] path=${path}`)
  assert(path, '[publishPackage] parameter "path" is required')

  const outputPath = `${path}/dist`

  if (!existsSync(`${outputPath}/package.json`)) {
    console.info(`[publishPackage] skipping, no build output at ${outputPath}`)
    return
  }

  const packageAlreadyPublished = await packagePrePublishChecks(path);
  if (packageAlreadyPublished) {
    return;
  }
  const { version } = await readPackageJson(path)

  // Update version and resolve workspace dependencies in dist package.json before publishing
  const versionMap = buildWorkspaceVersionMap(process.cwd())
  const json = JSON.parse(readFileSync(`${outputPath}/package.json`).toString())
  json.version = version
  json.main = './src/index.js'
  json.types = './src/index.d.ts'
  json.dependencies = stripSemverRanges(resolveWorkspaceDependencies(json.dependencies, versionMap))
  json.devDependencies = stripSemverRanges(resolveWorkspaceDependencies(json.devDependencies, versionMap))
  json.peerDependencies = stripSemverRanges(resolveWorkspaceDependencies(json.peerDependencies, versionMap))

  if (json.dependencies) {
    json.dependencies = pinDependenciesFromLockfile(json.dependencies, parseBunLock())
  }

  writeFileSync(`${outputPath}/package.json`, JSON.stringify(json, null, 2))

  assertNoUnresolvedWorkspaceDeps(`${outputPath}/package.json`)
  assertNoSemverRanges(`${outputPath}/package.json`)

  execSync(`npm publish --access public --tag latest`, { cwd: outputPath, stdio: 'inherit' })

  console.info(`[publishProject] success, path=${path}, version=${version}`)
}

const main = async (): Promise<void> => {
  const path = argv[2]
  await publishNpmPackage(path)
}

/*
 * module is entrypoint, not imported i.e. invoked directly
 * see https://nodejs.org/api/modules.html#modules_accessing_the_main_module
 */
if (require.main === module) {
  main()
}
