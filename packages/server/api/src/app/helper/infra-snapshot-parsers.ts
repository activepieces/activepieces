import { isNil } from '@activepieces/shared'

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && !isNil(value) && !Array.isArray(value)
}

function asRows(result: unknown): Record<string, unknown>[] {
    if (!Array.isArray(result)) {
        return []
    }
    const [first] = result
    if (Array.isArray(first)) {
        return asRows(first)
    }
    return result.filter(isRecord)
}

function toNumber(value: unknown): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : null
    }
    return null
}

function toText(value: unknown): string | null {
    return typeof value === 'string' ? value : null
}

function toCamelCase(key: string): string {
    return key.replace(/_([a-z0-9])/g, (_match, character: string) => character.toUpperCase())
}

function numericFields(row: Record<string, unknown>): Record<string, number> {
    return Object.fromEntries(
        Object.entries(row)
            .map(([key, value]) => [toCamelCase(key), toNumber(value)] as const)
            .filter((entry): entry is readonly [string, number] => !isNil(entry[1])),
    )
}

function pickNumbers({ info, keys }: PickNumbersParams): Record<string, number> {
    return Object.fromEntries(
        keys
            .map((key) => [toCamelCase(key), toNumber(info[key])] as const)
            .filter((entry): entry is readonly [string, number] => !isNil(entry[1])),
    )
}

function parseInfoSections(raw: string): Record<string, string> {
    return Object.fromEntries(
        raw.split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && !line.startsWith('#'))
            .map((line) => {
                const separator = line.indexOf(':')
                return separator > 0 ? [line.slice(0, separator), line.slice(separator + 1)] as const : null
            })
            .filter((entry): entry is readonly [string, string] => !isNil(entry)),
    )
}

function parseFieldList(raw: string): Record<string, string> {
    return Object.fromEntries(
        raw.split(',')
            .map((pair) => {
                const separator = pair.indexOf('=')
                return separator > 0 ? [pair.slice(0, separator).trim(), pair.slice(separator + 1).trim()] as const : null
            })
            .filter((entry): entry is readonly [string, string] => !isNil(entry)),
    )
}

function sumKeyspace(info: Record<string, string>): KeyspaceTotals {
    const totals = Object.entries(info)
        .filter(([key]) => /^db\d+$/.test(key))
        .reduce((accumulator, [, value]) => {
            const fields = parseFieldList(value)
            return {
                keys: accumulator.keys + (toNumber(fields['keys']) ?? 0),
                expires: accumulator.expires + (toNumber(fields['expires']) ?? 0),
            }
        }, { keys: 0, expires: 0 })
    return { keys: totals.keys, keysWithoutTtl: totals.keys - totals.expires }
}

export const infraSnapshotParsers = {
    asRows,
    toNumber,
    toText,
    numericFields,
    pickNumbers,
    parseInfoSections,
    parseFieldList,
    sumKeyspace,
}

type PickNumbersParams = {
    info: Record<string, string>
    keys: string[]
}

type KeyspaceTotals = {
    keys: number
    keysWithoutTtl: number
}
