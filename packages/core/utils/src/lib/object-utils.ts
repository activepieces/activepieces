import { isNil, isString } from './utils'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function deleteProperties(obj: Record<string, unknown>, props: string[]) {
    const copy = { ...obj }
    for (const prop of props) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete copy[prop]
    }
    return copy
}

export function omit<T extends object, K extends keyof T>(obj: T, keysToOmit: K[]): Omit<T, K> {
    return Object.fromEntries(
        Object.entries(obj).filter(([key]) => !keysToOmit.includes(key as K)),
    ) as Omit<T, K>
}

export const spreadIfNotUndefined = <T>(key: string, value: T | undefined): Record<string, T> => {
    if (value === undefined) {
        return {}
    }
    return {
        [key]: value,
    }
}

export const spreadIfDefined = <T>(key: string, value: T | undefined | null): Record<string, T> => {
    if (isNil(value)) {
        return {}
    }
    return {
        [key]: value,
    }
}

export function deleteProps<T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    prop: K[],
): Omit<T, K> {
    const newObj = { ...obj }
    for (const p of prop) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete newObj[p]
    }
    return newObj
}

export function cloneResolvedValue(value: unknown): unknown {
    switch (typeof value) {
        case 'string':
        case 'number':
        case 'boolean':
            return value
        case 'object': {
            if (value === null) {
                return null
            }
            const serialized = JSON.stringify(value)
            return isNil(serialized) ? undefined : JSON.parse(serialized)
        }
        default:
            return undefined
    }
}

export function sanitizeObjectForPostgresql<T>(input: T): T {
    return applyFunctionToValuesSync<T>(input, (str) => {
        if (isString(str)) {
            // Postgres text/jsonb cannot store NUL bytes or unpaired UTF-16 surrogates (e.g. a half-emoji
            // left behind by code-unit truncation) — both raise "invalid input syntax for type json".
            // eslint-disable-next-line no-control-regex
            const nullByteRegex = /\u0000/g
            const loneSurrogateRegex = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g
            return str.replace(nullByteRegex, '').replace(loneSurrogateRegex, '')
        }
        return str
    })
}
export function applyFunctionToValuesSync<T>(obj: unknown, apply: (str: string) => unknown): T {
    if (isNil(obj)) {
        return obj as T
    }
    else if (isString(obj)) {
        return apply(obj) as T
    }
    else if (Array.isArray(obj)) {
        return obj.map(item => applyFunctionToValuesSync(item, apply)) as unknown as T
    }
    else if (isObject(obj)) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, applyFunctionToValuesSync(value, apply)]),
        ) as T
    }
    return obj as T
}

export async function applyFunctionToValues<T>(obj: unknown, apply: (str: string) => Promise<unknown>): Promise<T> {
    if (isNil(obj)) {
        return obj as T
    }
    else if (isString(obj)) {
        return (await apply(obj)) as T
    }
    else if (Array.isArray(obj)) {
        // Create a new array and map over it with Promise.all
        const newArray = await Promise.all(obj.map(item => applyFunctionToValues(item, apply)))
        return newArray as unknown as T
    }
    else if (isObject(obj)) {
        // Use Object.fromEntries and map entries asynchronously
        const newEntries = await Promise.all(
            Object.entries(obj).map(async ([key, value]) => [key, await applyFunctionToValues(value, apply)]),
        )
        return Object.fromEntries(newEntries) as T
    }
    return obj as T
}

export const isObject = (obj: unknown): obj is Record<string, unknown> => {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

export function prune(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(prune)
    }
    if (typeof value === 'object' && value !== null) {
        const prunedEntries = Object.entries(value)
            .map(([key, entryValue]) => [key, prune(entryValue)] as const)
            .filter(([, entryValue]) => entryValue !== undefined)
        if (prunedEntries.length === 0) {
            return undefined
        }
        return Object.fromEntries(prunedEntries)
    }
    return value
}

export function deepEquals({ a, b }: DeepEqualsParams): boolean {
    if (a === b) {
        return true
    }
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
        return false
    }
    if (Array.isArray(a) || Array.isArray(b)) {
        return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, index) => deepEquals({ a: item, b: b[index] }))
    }
    const aRecord: Record<string, unknown> = { ...a }
    const bRecord: Record<string, unknown> = { ...b }
    const aKeys = Object.keys(aRecord)
    const bKeys = Object.keys(bRecord)
    return aKeys.length === bKeys.length && aKeys.every((key) => deepEquals({ a: aRecord[key], b: bRecord[key] }))
}

type DeepEqualsParams = {
    a: unknown
    b: unknown
}

export function groupBy<T, K extends string | number | symbol>(
    items: T[],
    keySelector: (item: T) => K,
): Record<K, T[]> {
    const result = {} as Record<K, T[]>
  
    for (const item of items) {
        const key = keySelector(item)
  
        if (!result[key]) {
            result[key] = []
        }
  
        result[key].push(item)
    }
  
    return result
}
  