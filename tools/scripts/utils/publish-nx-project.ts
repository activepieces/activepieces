import assert from 'node:assert'
import { argv } from 'node:process'
import { exec } from './exec'
import { readPackageJson, readProjectJson } from './files'
import { packagePrePublishChecks } from './package-pre-publish-checks'

export const publishNxProject = async (path: string): Promise<void> => {
  console.info(`[publishNxProject] path=${path}`)
  assert(path, '[publishNxProject] parameter "path" is required')

  const packageAlreadyPublished = await packagePrePublishChecks(path);

  if (packageAlreadyPublished) {
    return;
  }

  const { version } = await readPackageJson(path)
  const { name: nxProjectName } = await readProjectJson(path)

  const nxPublishProjectCommand = `
    node tools/scripts/publish.mjs \
      ${nxProjectName} \
      ${version} \
      latest
  `

  await exec(nxPublishProjectCommand)

  console.info(`[publishNxProject] success, path=${path}, version=${version}`)
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
