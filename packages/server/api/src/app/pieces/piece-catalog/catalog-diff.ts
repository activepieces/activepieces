import { PieceChangeType } from '@activepieces/shared'
import semver from 'semver'

export function diffCatalog({ snapshot, current }: { snapshot: CatalogSnapshot, current: CatalogEntry[] }): { changes: CatalogChange[], nextSnapshot: CatalogSnapshot } {
    const nextSnapshot: CatalogSnapshot = { ...snapshot }
    const changes: CatalogChange[] = []
    for (const entry of current) {
        const previousVersion = snapshot[entry.name] ?? null
        const changeType = previousVersion === null ? 'new' : compareVersions(previousVersion, entry.version)
        if (changeType === null) {
            continue
        }
        changes.push({ ...entry, previousVersion, changeType })
        nextSnapshot[entry.name] = entry.version
    }
    changes.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    return { changes, nextSnapshot }
}

function compareVersions(previousVersion: string, version: string): PieceChangeType | null {
    if (semver.valid(previousVersion) === null || semver.valid(version) === null) {
        return version > previousVersion ? 'patch' : null
    }
    if (!semver.gt(version, previousVersion)) {
        return null
    }
    switch (semver.diff(previousVersion, version)) {
        case 'major':
        case 'premajor':
            return 'major'
        case 'minor':
        case 'preminor':
            return 'minor'
        default:
            return 'patch'
    }
}

export type CatalogSnapshot = Record<string, string>

export type CatalogEntry = {
    name: string
    displayName: string
    version: string
    minimumSupportedRelease: string | null
    deprecated: boolean
}

export type CatalogChange = CatalogEntry & {
    previousVersion: string | null
    changeType: PieceChangeType
}
