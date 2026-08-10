import { isNil } from '@activepieces/core-utils'
import { SENSITIVE_VALUE_REDACTED } from '../../engine/engine-constants'

export function applySensitivePaths<T>(value: T, paths: string[] | undefined): T {
    if (isNil(paths) || paths.length === 0) {
        return value
    }
    return paths.reduce<T>((acc, path) => redactAtPath(acc, splitSensitivePath(path)) as T, value)
}

export function escapeSensitivePathSegment(segment: string): string {
    return segment.replace(/\\/g, '\\\\').replace(/\./g, '\\.')
}

export function splitSensitivePath(path: string): string[] {
    const segments: string[] = []
    let current = ''
    let i = 0
    while (i < path.length) {
        const ch = path[i]
        if (ch === '\\' && i + 1 < path.length) {
            current += path[i + 1]
            i += 2
            continue
        }
        if (ch === '.') {
            segments.push(current)
            current = ''
            i++
            continue
        }
        current += ch
        i++
    }
    segments.push(current)
    return segments
}

function redactAtPath(value: unknown, segments: string[]): unknown {
    if (segments.length === 0) {
        return SENSITIVE_VALUE_REDACTED
    }
    if (isNil(value) || typeof value !== 'object') {
        return value
    }
    const [head, ...tail] = segments
    if (Array.isArray(value)) {
        if (!/^\d+$/.test(head)) {
            return value
        }
        const idx = parseInt(head, 10)
        if (idx < 0 || idx >= value.length) {
            return value
        }
        const next = redactAtPath(value[idx], tail)
        if (next === value[idx]) {
            return value
        }
        return value.map((v, i) => (i === idx ? next : v))
    }
    const record = value as Record<string, unknown>
    if (!Object.hasOwn(record, head)) {
        return value
    }
    const next = redactAtPath(record[head], tail)
    if (next === record[head]) {
        return value
    }
    return { ...record, [head]: next }
}
