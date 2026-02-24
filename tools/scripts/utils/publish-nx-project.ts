import assert from 'node:assert'
import { argv } from 'node:process'
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { readPackageJson } from './files'
import { packagePrePublishChecks } from './package-pre-publish-checks'

export const publishNxProject = async (path: string): Promise<void> => {
  console.info(`[publishProject] path=${path}`)
  assert(path, '[publishProject] parameter "path" is required')

  const packageAlreadyPublished = await packagePrePublishChecks(path);

  if (packageAlreadyPublished) {
    return;
  }

  const { version } = await readPackageJson(path)

  // Output path follows the convention: dist/{source-path}
  const outputPath = `dist${path}`

  // Update version in dist package.json before publishing
  try {
    const json = JSON.parse(readFileSync(`${outputPath}/package.json`).toString())
    json.version = version
    writeFileSync(`${outputPath}/package.json`, JSON.stringify(json, null, 2))
  } catch (e) {
    console.error(`Error reading package.json file from build output at ${outputPath}`)
    throw e
  }

  execSync(`npm publish --access public --tag latest`, { cwd: outputPath, stdio: 'inherit' })

  console.info(`[publishProject] success, path=${path}, version=${version}`)
}

const main = async (): Promise<void> => {
  const path = argv[2]
  await publishNxProject(path)
}

/*
 * module is entrypoint, not imported i.e. invoked directly
 * see https://nodejs.org/api/modules.html#modules_accessing_the_main_module
 */
if (require.main === module) {
  main()
}
