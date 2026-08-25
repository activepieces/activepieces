import assert from 'node:assert'
import { argv } from 'node:process'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { readPackageJson } from './files'
import { packagePrePublishChecks } from './package-pre-publish-checks'
import { preparePieceDistForPublish } from '../../../packages/cli/src/lib/utils/prepare-piece-utils'
import { isExactVersion } from '../../../packages/cli/src/lib/utils/workspace-utils'

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

// Final, bullet-proof publish gate. A published piece is a self-contained bundle: every
// @activepieces/* library (shared, framework, common, core-*) is inlined and NONE of them is
// published to npm, and there must be no unresolved workspace:* dep. So refuse to publish if any
// dependency is either still a workspace:* range OR an @activepieces/* package — regardless of how
// it leaked into the manifest. This catches bundler/manifest regressions before they hit the registry.
function assertNoUnpublishableDeps(packageJsonPath: string): void {
  const json = JSON.parse(readFileSync(packageJsonPath).toString())
  const depFields = ['dependencies', 'devDependencies', 'peerDependencies'] as const
  const offending: string[] = []

  for (const field of depFields) {
    const deps: Record<string, string> | undefined = json[field]
    if (!deps) {
      continue
    }
    for (const [name, version] of Object.entries(deps)) {
      if (version.startsWith('workspace:')) {
        offending.push(`${field}.${name}: ${version} (unresolved workspace dependency)`)
      } else if (name.startsWith('@activepieces/')) {
        offending.push(`${field}.${name}: ${version} (must be bundled, never published)`)
      }
    }
  }

  if (offending.length > 0) {
    throw new Error(
      `[publishPackage] refusing to publish ${json.name}@${json.version} — unpublishable dependencies:\n  ${offending.join('\n  ')}`,
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

  // Bundles the piece into a self-contained artifact and rewrites the manifest (strips the
  // @activepieces/* + workspace deps that are now inlined). MUST be awaited — it copies the
  // source package.json (with workspace:* deps) before the async bundle+rewrite, so reading the
  // manifest before it resolves would see the un-stripped deps and fail the assertion below.
  await preparePieceDistForPublish(path)

  const json = JSON.parse(readFileSync(`${outputPath}/package.json`).toString())
  json.version = version
  writeFileSync(`${outputPath}/package.json`, JSON.stringify(json, null, 2))

  assertNoUnpublishableDeps(`${outputPath}/package.json`)
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
