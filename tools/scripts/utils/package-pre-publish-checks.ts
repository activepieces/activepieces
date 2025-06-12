import assert from 'node:assert'
import { ExecException } from 'node:child_process'
import axios, { AxiosError } from 'axios'
import { exec } from './exec'
import { readPackageJson } from './files'

const getLatestPublishedVersion = async (packageName: string, maxRetries: number = 5): Promise<string | null> => {
  console.info(`[getLatestPublishedVersion] packageName=${packageName}`);

  const retryDelay = (attempt: number) => Math.pow(4, attempt - 1) * 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios<{ version: string }>(`https://registry.npmjs.org/${packageName}/latest`);
      const version = response.data.version;
      console.info(`[getLatestPublishedVersion] packageName=${packageName}, latestVersion=${version}`);
      return version;
    } catch (e: unknown) {
      if (attempt === maxRetries) {
        throw e; // If it's the last attempt, rethrow the error
      }

      if (e instanceof AxiosError && e.response?.status === 404) {
        console.info(`[getLatestPublishedVersion] packageName=${packageName}, latestVersion=null`);
        return null;
      }

      console.warn(`[getLatestPublishedVersion] packageName=${packageName}, attempt=${attempt}, error=${e}`);
      const delay = retryDelay(attempt);
      await new Promise(resolve => setTimeout(resolve, delay)); // Wait for the delay before retrying
    }
  }

  return null; // Return null if all retries fail
};


const packageChangedFromMainBranch = async (path: string): Promise<boolean> => {
  const cleaned = path.includes('/packages') ? `packages/` + path.split('packages/')[1] : path
  if (!cleaned.startsWith('packages/')) {
    throw new Error(`[packageChangedFromMainBranch] path=${cleaned} is not a valid package path`)
  }
  console.info(`[packageChangedFromMainBranch] path=${cleaned}`)

  try {
    const diff = await exec(`git diff --quiet origin/main -- ${cleaned}`)
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
      throw new Error(`[packagePrePublishValidation] package version not incremented, path=${path}, version=${currentVersion}`)
    }

    console.info(`[packagePrePublishValidation] package already published, path=${path}, version=${currentVersion}`)
    return true
  }

  return false
}
