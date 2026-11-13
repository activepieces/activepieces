import assert from 'node:assert'
import { argv } from 'node:process'
import { execSync, spawnSync } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { tryCatchSync } from '@activepieces/core-utils'
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

  const publish = spawnSync('npm', ['publish', '--access', 'public', '--tag', 'latest'], { cwd: outputPath, stdio: ['ignore', 'inherit', 'pipe'], encoding: 'utf8' })
  process.stderr.write(publish.stderr ?? '')
  if (publish.status !== 0) {
    if (publish.stderr?.includes('previously staged version')) {
      await waitForStagedVersion({ name: json.name, version, path })
      return
    }
    if (!isVersionOnRegistry({ name: json.name, version })) {
      throw new Error(`[publishProject] npm publish failed, path=${path}, version=${version}, exitCode=${publish.status}`)
    }
    console.info(`[publishProject] publish failed but version is already on registry, path=${path}, version=${version}`)
    return
  }

  console.info(`[publishProject] success, path=${path}, version=${version}`)
}

function isVersionOnRegistry({ name, version }: { name: string, version: string }): boolean {
  const { data } = tryCatchSync(() => execSync(`npm view ${name}@${version} version`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))
  return data?.trim() === version
}

async function waitForStagedVersion({ name, version, path }: { name: string, version: string, path: string }): Promise<void> {
  for (let attempt = 1; attempt <= STAGED_VERSION_POLL_ATTEMPTS; attempt++) {
    console.info(`[publishProject] version staged on registry but not live yet, path=${path}, version=${version}, attempt=${attempt}/${STAGED_VERSION_POLL_ATTEMPTS}`)
    await sleep(STAGED_VERSION_POLL_INTERVAL_MS)
    if (isVersionOnRegistry({ name, version })) {
      console.info(`[publishProject] staged version is now live on registry, path=${path}, version=${version}`)
      return
    }
  }
  throw new Error(`[publishProject] ${name}@${version} is staged on npm but still not live after ${STAGED_VERSION_POLL_ATTEMPTS * STAGED_VERSION_POLL_INTERVAL_MS / 60000} minutes; inspect it with "npm stage list ${name}"`)
}

const STAGED_VERSION_POLL_ATTEMPTS = 20
const STAGED_VERSION_POLL_INTERVAL_MS = 15000

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
