import { isObject } from '@activepieces/core-utils'

// Squeezes long strings before dropping array items, because in a tool output the bulk is almost
// always a few oversized strings (an email body, an HTML page, a base64 part) while the items are
// the records that were asked for.
function shrinkValue({ value, limits, ancestors = new Set<object>() }: { value: unknown, limits: ShrinkLimits, ancestors?: Set<object> }): unknown {
    if (typeof value === 'string') {
        if (value.length <= limits.maxStringLength) return value
        return `${value.slice(0, limits.maxStringLength)}…[truncated ${value.length - limits.maxStringLength} chars]`
    }
    if (!Array.isArray(value) && !isObject(value)) return value
    if (ancestors.has(value)) return '[circular]'
    ancestors.add(value)
    const shrunk = Array.isArray(value)
        ? shrinkArray({ value, limits, ancestors })
        : Object.fromEntries(Object.entries(value).map(([key, val]) => [key, shrinkValue({ value: val, limits, ancestors })]))
    ancestors.delete(value)
    return shrunk
}

function shrinkArray({ value, limits, ancestors }: { value: unknown[], limits: ShrinkLimits, ancestors: Set<object> }): unknown[] {
    const kept = value.slice(0, limits.maxArrayItems).map((item) => shrinkValue({ value: item, limits, ancestors }))
    return value.length > limits.maxArrayItems
        ? [...kept, `…and ${value.length - limits.maxArrayItems} more items`]
        : kept
}

// Returns the value wrapped for delivery, shrunk just enough that the WRAPPED form fits the budget —
// so the caller's own envelope and its JSON escaping are part of what is measured, not guessed at.
// Null when no rung fits, which leaves the caller to say so rather than emit a mangled prefix.
function fitToBudget<T>({ value, maxBytes, wrap }: {
    value: unknown
    maxBytes: number
    wrap: (json: string) => T
}): T | null {
    for (const limits of SHRINK_LADDER) {
        const json = serialize(shrinkValue({ value, limits }))
        if (json === null) return null
        const wrapped = wrap(json)
        const size = byteSizeOf(wrapped)
        if (size !== null && size <= maxBytes) return wrapped
    }
    return null
}

function byteSizeOf(value: unknown): number | null {
    const serialized = typeof value === 'string' ? value : serialize(value)
    return serialized === null ? null : Buffer.byteLength(serialized, 'utf8')
}

function serialize(value: unknown): string | null {
    try {
        return JSON.stringify(value) ?? null
    }
    catch {
        return null
    }
}

const SHRINK_LADDER: ShrinkLimits[] = [
    { maxStringLength: 2_000, maxArrayItems: 200 },
    { maxStringLength: 400, maxArrayItems: 100 },
    { maxStringLength: 200, maxArrayItems: 50 },
    { maxStringLength: 80, maxArrayItems: 25 },
]

// What one tool result may occupy of the model's context.
export const MAX_TOOL_RESULT_BYTES = 128 * 1024

export const largeResultUtils = {
    shrinkValue,
    fitToBudget,
    byteSizeOf,
}

export type ShrinkLimits = { maxStringLength: number, maxArrayItems: number }
