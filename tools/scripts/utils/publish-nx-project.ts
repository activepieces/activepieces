import assert from 'node:assert'
import { ExecException } from 'node:child_process'
import { exit, argv } from 'node:process'
import axios, { AxiosError } from 'axios'
import { exec } from './exec'
import { readPackageJson, readProjectJson } from './files'

const getLatestPublishedVersion = async (packageName: string): Promise<string | null> => {
  console.info(`[getLatestPublishedVersion] packageName=${packageName}`)

  try {
    const response = await axios<{version: string}>(`https://registry.npmjs.org/${packageName}/latest`)
    return response.data.version
  }
  catch (e: unknown) {
      if (e instanceof AxiosError && e.response?.status === 404) {
        return null
      }

      throw e
  }
}

const packageChangedFromMainBranch = async (path: string): Promise<boolean> => {
  console.info(`[packageChangedFromMainBranch] path=${path}`)

  try {
    const diff = await exec(`git diff --quiet main ${path}`)
    return false
  }
  catch (e) {
    if ((e as ExecException).code === 1) {
      return true
    }

    throw e
  }
}

export const publishNxProject = async (path: string): Promise<void> => {
  console.info(`[publishNxProject] path=${path}`)

  assert(path, '[publishNxProject] parameter "path" is required')

  const { name: packageName, version: currentVersion } = await readPackageJson(path)
  const latestPublishedVersion = await getLatestPublishedVersion(packageName)
  const currentVersionAlreadyPublished = latestPublishedVersion !== null && currentVersion === latestPublishedVersion

  if (currentVersionAlreadyPublished) {
    const packageChanged = await packageChangedFromMainBranch(path)

    if (packageChanged) {
      console.error(`[publishNxProject] package changed but version not incremented, path=${path}`)
      exit(1)
    }

    console.info(`[publishNxProject] package already published, path=${path}, version=${currentVersion}`)
    return
  }

  const { name: nxProjectName } = await readProjectJson(path)

  const nxPublishProjectCommand = `
    node tools/scripts/publish.mjs \
      ${nxProjectName} \
      ${currentVersion} \
      latest
  `

  await exec(nxPublishProjectCommand)

  console.info(`[publishNxProject] success, path=${path}, version=${currentVersion}`)
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
