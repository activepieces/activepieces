import { isNil } from '@activepieces/core-utils';
import fs from 'fs'
import path from 'path'
import { apLogger } from './ap-logger'

const logger = apLogger.create()

let cachedCurrentRelease: string | undefined
let cachedLatestRelease: string | undefined

function readCurrentRelease(): string {
    if (cachedCurrentRelease !== undefined) {
        return cachedCurrentRelease
    }
    const packageJsonPath = path.resolve(process.cwd(), 'package.json')
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson
        if (typeof packageJson.version !== 'string') {
            logger.warn({ packageJsonPath }, 'package.json has no string "version" field, defaulting current release to 0.0.0')
            cachedCurrentRelease = UNKNOWN_VERSION
        }
        else {
            cachedCurrentRelease = packageJson.version
        }
    }
    catch (e) {
        logger.warn({ error: e, packageJsonPath, cwd: process.cwd() }, 'failed to read package.json, defaulting current release to 0.0.0')
        cachedCurrentRelease = UNKNOWN_VERSION
    }
    return cachedCurrentRelease
}

export const apVersionUtil = {
    getCurrentRelease(): string {
        return readCurrentRelease()
    },
    getReleaseInfo(): ReleaseInfo {
        const version = readCurrentRelease()
        return { version, readOk: version !== UNKNOWN_VERSION }
    },
    async getLatestRelease(): Promise<string> {
        try {
            if (cachedLatestRelease) {
                return cachedLatestRelease
            }
            const response = await fetch(
                'https://raw.githubusercontent.com/activepieces/activepieces/main/package.json',
                {
                    signal: AbortSignal.timeout(5000),
                },
            )
            const data = await response.json() as PackageJson
            cachedLatestRelease = data.version
            return data.version
        }
        catch (ex) {
            return UNKNOWN_VERSION
        }
    },
    //could be null if the other is running on something older than 0.85.0
    versionsAreCompatible({ versionA, versionB }: { versionA: string | undefined, versionB: string | undefined }): boolean {
        if (isNil(versionA) || isNil(versionB)) {
            return false
        }
        if (versionA === UNKNOWN_VERSION || versionB === UNKNOWN_VERSION) {
            return false
        }
        return versionA === versionB
    },
}

export const UNKNOWN_VERSION = '0.0.0'

type PackageJson = {
    version: string
}

type ReleaseInfo = {
    version: string
    readOk: boolean
}
