import { isNil } from '@activepieces/core-utils'
import { SENSITIVE_VALUE_REDACTED } from '../../engine/engine-constants'

export { escapeSensitivePathSegment } from '@activepieces/core-utils'

export function applySensitivePaths(value: unknown, paths: string[] | undefined): unknown {
    if (isNil(paths) || paths.length === 0) {
        return value
    }
    return paths.reduce<unknown>((acc, path) => redactAtPath(acc, splitSensitivePath(path)), value)
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
    if (!isRecord(value) && !Array.isArray(value)) {
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
    if (!Object.hasOwn(value, head)) {
        return value
    }
    const next = redactAtPath(value[head], tail)
    if (next === value[head]) {
        return value
    }
    return { ...value, [head]: next }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !isNil(value) && typeof value === 'object' && !Array.isArray(value)
}
