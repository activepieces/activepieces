import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function buildWorkspaceVersionMap(rootDir: string): Map<string, string> {
  const versionMap = new Map<string, string>()
  const rootPkg = JSON.parse(readFileSync(join(rootDir, 'package.json')).toString())
  const workspacePatterns: string[] = rootPkg.workspaces ?? []

  for (const pattern of workspacePatterns) {
    if (pattern.endsWith('/*')) {
      const dir = join(rootDir, pattern.slice(0, -2))
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
      const pkgPath = join(rootDir, pattern, 'package.json')
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath).toString())
        versionMap.set(pkg.name, pkg.version)
      }
    }
  }

  return versionMap
}

export function resolveWorkspaceDependencies(
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
      } else {
        throw new Error(`Failed to resolve workspace dependency ${name}: ${version}. Package not found in workspace.`)
      }
    } else {
      resolved[name] = version
    }
  }
  return resolved
}

export function isExactVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)
}

export function stripSemverRanges(
  deps: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!deps) {
    return deps
  }
  const stripped: Record<string, string> = {}
  for (const [name, version] of Object.entries(deps)) {
    const pinned = version.replace(/^[\^~]/, '')
    if (!isExactVersion(pinned)) {
      throw new Error(`[stripSemverRanges] unsupported version range for ${name}: "${version}"`)
    }
    stripped[name] = pinned
  }
  return stripped
}
