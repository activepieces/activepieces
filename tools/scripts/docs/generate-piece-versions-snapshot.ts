import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const REGISTRY_URL = 'https://cloud.activepieces.com/api/v1/pieces'
const OLDEST_MINOR = 50
const CONCURRENCY = 8
const SNAPSHOT_FILE = path.join(__dirname, '../../../docs/snippets/piece-version-checker.jsx')
const SNAPSHOT_PREFIX = 'export const PIECE_VERSIONS_SNAPSHOT = '

async function main(): Promise<void> {
    const releases = listReleases()
    const registries = await mapWithConcurrency({
        items: releases,
        limit: CONCURRENCY,
        fn: (release) => fetchJson<RegistryEntry[]>({ url: `${REGISTRY_URL}/registry?release=${release}&edition=ce` }),
    })
    const summaries = await fetchJson<PieceSummary[]>({ url: REGISTRY_URL })
    const displayNames = new Map(summaries.map((piece) => [piece.name, piece.displayName]))

    const availability = collectAvailability({ registries })
    const pieces = [...groupByPiece({ availability }).entries()]
        .map(([name, versions]) => ({
            name,
            displayName: displayNames.get(name) ?? shortName({ name }),
            groups: groupVersions({ versions }),
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .map((piece) => [piece.displayName, shortName({ name: piece.name }), piece.groups])

    const snapshot = JSON.stringify({ releases, pieces })
    const source = readFileSync(SNAPSHOT_FILE, 'utf8')
    const lines = source.split('\n')
    const index = lines.findIndex((line) => line.startsWith(SNAPSHOT_PREFIX))
    if (index === -1) {
        throw new Error(`${SNAPSHOT_PREFIX} not found in ${SNAPSHOT_FILE}`)
    }
    const updated = lines.map((line, i) => (i === index ? `${SNAPSHOT_PREFIX}${snapshot};` : line)).join('\n')
    writeFileSync(SNAPSHOT_FILE, updated)
    console.info(`Wrote ${pieces.length} pieces across ${releases.length} releases (${releases[0]} to ${releases[releases.length - 1]})`)
}

function listReleases(): string[] {
    return execSync('git tag --list', { encoding: 'utf8' })
        .split('\n')
        .filter((tag) => /^0\.\d+\.\d+$/.test(tag))
        .filter((tag) => Number(tag.split('.')[1]) >= OLDEST_MINOR)
        .sort((a, b) => compareVersions({ a, b }))
}

async function fetchJson<T>({ url }: { url: string }): Promise<T> {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`GET ${url} failed with ${response.status}`)
    }
    return response.json()
}

async function mapWithConcurrency<T, R>({ items, limit, fn }: { items: T[], limit: number, fn: (item: T) => Promise<R> }): Promise<R[]> {
    const results = new Array<R>(items.length)
    const queue = items.map((item, index) => ({ item, index }))
    const workers = Array.from({ length: limit }, async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
            results[next.index] = await fn(next.item)
        }
    })
    await Promise.all(workers)
    return results
}

function collectAvailability({ registries }: { registries: RegistryEntry[][] }): Map<string, Availability> {
    return registries.reduce((acc, entries, releaseIndex) => {
        entries.forEach((entry) => {
            const key = `${entry.name}@${entry.version}`
            const existing = acc.get(key)
            acc.set(key, {
                name: entry.name,
                version: entry.version,
                first: existing?.first ?? releaseIndex,
                last: releaseIndex,
            })
        })
        return acc
    }, new Map<string, Availability>())
}

function groupByPiece({ availability }: { availability: Map<string, Availability> }): Map<string, Availability[]> {
    return [...availability.values()].reduce((acc, entry) => {
        acc.set(entry.name, [...(acc.get(entry.name) ?? []), entry])
        return acc
    }, new Map<string, Availability[]>())
}

function groupVersions({ versions }: { versions: Availability[] }): VersionGroup[] {
    const sorted = [...versions].sort((a, b) => compareVersions({ a: a.version, b: b.version }))
    return sorted.reduce<VersionGroup[]>((groups, entry) => {
        const previous = groups[groups.length - 1]
        if (previous && previous[2] === entry.first && previous[3] === entry.last) {
            return [...groups.slice(0, -1), [previous[0], entry.version, previous[2], previous[3], previous[4] + 1]]
        }
        return [...groups, [entry.version, entry.version, entry.first, entry.last, 1]]
    }, [])
}

function compareVersions({ a, b }: { a: string, b: string }): number {
    const left = a.split(/[.-]/).map(Number)
    const right = b.split(/[.-]/).map(Number)
    const length = Math.max(left.length, right.length)
    for (let i = 0; i < length; i++) {
        const diff = (left[i] || 0) - (right[i] || 0)
        if (diff !== 0) {
            return diff
        }
    }
    return 0
}

function shortName({ name }: { name: string }): string {
    return name.replace('@activepieces/piece-', '')
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})

type RegistryEntry = {
    name: string
    version: string
}

type PieceSummary = {
    name: string
    displayName: string
}

type Availability = {
    name: string
    version: string
    first: number
    last: number
}

type VersionGroup = [firstVersion: string, lastVersion: string, firstRelease: number, lastRelease: number, count: number]
