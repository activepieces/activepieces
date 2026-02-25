import assert from 'node:assert'
import { argv } from 'node:process'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { readPackageJson } from './files'
import { packagePrePublishChecks } from './package-pre-publish-checks'

function buildWorkspaceVersionMap(): Map<string, string> {
  const versionMap = new Map<string, string>()
  const rootPkg = JSON.parse(readFileSync('package.json').toString())
  const workspacePatterns: string[] = rootPkg.workspaces ?? []

  for (const pattern of workspacePatterns) {
    if (pattern.endsWith('/*')) {
      const dir = pattern.slice(0, -2)
      if (!existsSync(dir)) {
        continue
      }
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          const pkgPath = join(dir, entry.name, 'package.json')
          if (existsSync(pkgPath)) {
            const pkg = JSON.parse(readFileSync(pkgPath).toString())
            versionMap.set(pkg.name, pkg.version)
          }
        }
      }
    } else {
      const pkgPath = join(pattern, 'package.json')
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath).toString())
        versionMap.set(pkg.name, pkg.version)
      }
    }
  }

  return versionMap
}

function resolveWorkspaceDependencies(
  deps: Record<string, string> | undefined,
  versionMap: Map<string, string>,
): Record<string, string> | undefined {
  if (!deps) {
    return deps
  }
  const resolved: Record<string, string> = {}
  for (const [name, version] of Object.entries(deps)) {
    if (version.startsWith('workspace:')) {
      const resolvedVersion = versionMap.get(name)
      if (resolvedVersion) {
        resolved[name] = resolvedVersion
        console.info(`[publishPackage] resolved ${name}: ${version} -> ${resolvedVersion}`)
      } else {
        throw new Error(`[publishPackage] failed to resolve workspace dependency ${name}: ${version}. Package not found in workspace.`)
      }
    } else {
      resolved[name] = version
    }
  }
  return resolved
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

  const localDistPath = `${path}/dist`

  if (!existsSync(`${localDistPath}/package.json`)) {
    console.info(`[publishPackage] skipping, no build output at ${localDistPath}`)
    return
  }

  const packageAlreadyPublished = await packagePrePublishChecks(path);
  if (packageAlreadyPublished) {
    return;
  }
  const { version } = await readPackageJson(path)

  // Update version and resolve workspace dependencies in dist package.json before publishing
  const versionMap = buildWorkspaceVersionMap()
  const json = JSON.parse(readFileSync(`${localDistPath}/package.json`).toString())
  json.version = version
  json.dependencies = resolveWorkspaceDependencies(json.dependencies, versionMap)
  json.devDependencies = resolveWorkspaceDependencies(json.devDependencies, versionMap)
  json.peerDependencies = resolveWorkspaceDependencies(json.peerDependencies, versionMap)
  writeFileSync(`${localDistPath}/package.json`, JSON.stringify(json, null, 2))

  assertNoUnresolvedWorkspaceDeps(`${localDistPath}/package.json`)

  execSync(`npm publish --access public --tag latest`, { cwd: localDistPath, stdio: 'inherit' })

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
