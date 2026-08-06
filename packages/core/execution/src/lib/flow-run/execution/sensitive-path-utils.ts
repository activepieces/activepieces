import { isNil } from '@activepieces/core-utils'
import { SENSITIVE_VALUE_REDACTED } from '../../engine/engine-constants'

export function applySensitivePaths(value: unknown, paths: string[] | undefined): unknown {
    if (isNil(paths) || paths.length === 0) {
        return value
    }
    return paths.reduce((acc, path) => redactAtPath(acc, path.split('.')), value)
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
        const idx = Number(head)
        if (Number.isNaN(idx) || idx < 0 || idx >= value.length) {
            return value
        }
        const next = redactAtPath(value[idx], tail)
        if (next === value[idx]) {
            return value
        }
        return value.map((v, i) => (i === idx ? next : v))
    }
    const record = value as Record<string, unknown>
    if (!(head in record)) {
        return value
    }
    const next = redactAtPath(record[head], tail)
    if (next === record[head]) {
        return value
    }
    return { ...record, [head]: next }
}
