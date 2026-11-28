import { isNil } from '@activepieces/core-utils'
import { ReleaseFeedEntry, ReleaseKind } from '@activepieces/shared'
import fs from 'fs'
import path from 'path'
import { apLogger } from './ap-logger'

const logger = apLogger.create()

let cachedCurrentRelease: string | undefined

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

function highestTag({ entries }: { entries: ReleaseFeedEntry[] }): string | null {
    return entries.reduce<string | null>((highest, entry) => isNil(highest) || compareTags({ a: entry.tag, b: highest }) > 0 ? entry.tag : highest, null)
}

function compareTags({ a, b }: { a: string, b: string }): number {
    const [coreA, preA] = a.split('-', 2)
    const [coreB, preB] = b.split('-', 2)
    const partsA = coreA.split('.').map(Number)
    const partsB = coreB.split('.').map(Number)
    for (let i = 0; i < 3; i++) {
        if (partsA[i] !== partsB[i]) {
            return partsA[i] - partsB[i]
        }
    }
    if (preA === preB) {
        return 0
    }
    if (preA === undefined) {
        return -1
    }
    if (preB === undefined) {
        return 1
    }
    return preA.localeCompare(preB, undefined, { numeric: true })
}

export const apVersionUtil = {
    getCurrentRelease(): string {
        return readCurrentRelease()
    },
    getRunningTag(): string {
        const releaseTag = process.env[RELEASE_TAG_ENV]
        return isNil(releaseTag) || releaseTag.length === 0 ? readCurrentRelease() : releaseTag
    },
    getLatestRelease({ entries }: { entries: ReleaseFeedEntry[] }): string | null {
        return highestTag({ entries: entries.filter((entry) => LATEST_RELEASE_KINDS.includes(entry.kind) && isNil(entry.avoid)) })
    },
    getHotfixOnLine({ entries, running }: { entries: ReleaseFeedEntry[], running: string }): string | null {
        const line = running.split('.').slice(0, 2).join('.')
        return highestTag({ entries: entries.filter((entry) => entry.kind === ReleaseKind.HOTFIX && entry.line === line && compareTags({ a: entry.tag, b: running }) > 0) })
    },
    compareTags,
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

const RELEASE_TAG_ENV = 'AP_RELEASE_TAG'
const LATEST_RELEASE_KINDS: ReleaseKind[] = [ReleaseKind.MINOR, ReleaseKind.PATCH]

export const UNKNOWN_VERSION = '0.0.0'

type PackageJson = {
    version: string
}
