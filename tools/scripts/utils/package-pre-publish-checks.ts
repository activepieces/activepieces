import assert from 'node:assert'
import { ExecException } from 'node:child_process'
import axios, { AxiosError } from 'axios'
import { exec } from './exec'
import { readPackageJson } from './files'

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

/**
 * Validates the package before publishing.
 * returns false if package can be published.
 * returns true if package is already published.
 * throws if validation fails.
 * @param path path of package to run pre-publishing checks for
 */
export const packagePrePublishChecks = async (path: string): Promise<boolean> => {
  console.info(`[packagePrePublishValidation] path=${path}`)

  assert(path, '[packagePrePublishValidation] parameter "path" is required')

  const { name: packageName, version: currentVersion } = await readPackageJson(path)
  const latestPublishedVersion = await getLatestPublishedVersion(packageName)
  const currentVersionAlreadyPublished = latestPublishedVersion !== null && currentVersion === latestPublishedVersion

  if (currentVersionAlreadyPublished) {
    const packageChanged = await packageChangedFromMainBranch(path)

    if (packageChanged) {
      throw new Error(`[packagePrePublishValidation] package changed but version not incremented, path=${path}`)
    }

    console.info(`[packagePrePublishValidation] package already published, path=${path}, version=${currentVersion}`)
    return true
  }

  return false
}
