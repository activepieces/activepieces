import { isNil, isObject, tryCatchSync } from '@activepieces/core-utils'

function normalize({ input, schema }: { input: unknown, schema: unknown }): unknown {
    return normalizeValue({ value: input, schema, depth: 0 })
}

function normalizeJsonText({ text, schema }: { text: string, schema: unknown }): string | undefined {
    const { data: parsed, error } = tryCatchSync((): unknown => JSON.parse(text))
    if (!isNil(error)) {
        return undefined
    }
    const normalized = normalize({ input: parsed, schema })
    const serialized = JSON.stringify(normalized)
    return serialized === JSON.stringify(parsed) ? undefined : serialized
}

function normalizeValue({ value, schema, depth }: { value: unknown, schema: unknown, depth: number }): unknown {
    if (depth > MAX_DEPTH || !isObject(schema) || isNil(value)) {
        return value
    }
    const variants = schemaVariants(schema)
    if (variants.length > 1) {
        return normalizeAgainstVariants({ value, variants, depth })
    }
    const types = typesOf(schema)
    if (types.has('object')) {
        return normalizeObject({ value, schema, depth })
    }
    if (types.has('array')) {
        return normalizeArray({ value, schema, depth })
    }
    return normalizeScalar({ value, types })
}

function normalizeAgainstVariants({ value, variants, depth }: { value: unknown, variants: Record<string, unknown>[], depth: number }): unknown {
    const exact = variants.find((variant) => matchesType({ value, types: typesOf(variant) }))
    if (!isNil(exact)) {
        return normalizeValue({ value, schema: exact, depth: depth + 1 })
    }
    for (const variant of variants) {
        const candidate = normalizeValue({ value, schema: variant, depth: depth + 1 })
        if (matchesType({ value: candidate, types: typesOf(variant) })) {
            return candidate
        }
    }
    return value
}

function normalizeObject({ value, schema, depth }: { value: unknown, schema: Record<string, unknown>, depth: number }): unknown {
    const parsed = typeof value === 'string' ? parseJson(value) : value
    if (!isObject(parsed)) {
        return value
    }
    const properties = isObject(schema['properties']) ? schema['properties'] : {}
    const required = Array.isArray(schema['required']) ? schema['required'].filter((key): key is string => typeof key === 'string') : []
    const unwrapped = renameAliasedKeys({ value: unwrapEnvelope({ value: parsed, properties, required, depth }), properties, required })
    return Object.fromEntries(Object.entries(unwrapped)
        .filter(([key, child]) => !isEmptyStructuredValue({ value: child, schema: properties[key], required: required.includes(key) }))
        .map(([key, child]) => [
            key,
            key in properties ? normalizeValue({ value: child, schema: properties[key], depth: depth + 1 }) : child,
        ]))
}

function unwrapEnvelope({ value, properties, required, depth }: { value: Record<string, unknown>, properties: Record<string, unknown>, required: string[], depth: number }): Record<string, unknown> {
    if (depth > MAX_DEPTH || Object.keys(properties).length === 0) {
        return value
    }
    const keys = Object.keys(value)
    const missingRequired = required.filter((key) => !(key in value))
    const envelopeKey = keys.find((key) => {
        const inner = value[key]
        if (!ENVELOPE_KEYS.has(key) || !isObject(inner)) {
            return false
        }
        const innerKeys = Object.keys(inner)
        const undeclaredWrapper = !(key in properties) && innerKeys.some((innerKey) => innerKey in properties)
        const onlyKeyOutside = keys.every((other) => other === key || other in properties)
        const holdsMissingKeys = onlyKeyOutside && missingRequired.some((missing) => innerKeys.includes(missing))
        return undeclaredWrapper || holdsMissingKeys
    })
    if (isNil(envelopeKey)) {
        return value
    }
    const inner = value[envelopeKey]
    if (!isObject(inner)) {
        return value
    }
    const siblings = Object.fromEntries(keys.filter((key) => key !== envelopeKey && key in properties).map((key) => [key, value[key]]))
    return unwrapEnvelope({ value: { ...siblings, ...inner }, properties, required, depth: depth + 1 })
}

function isEmptyStructuredValue({ value, schema, required }: { value: unknown, schema: unknown, required: boolean }): boolean {
    if (required || value !== '' || !isObject(schema)) {
        return false
    }
    const types = typesOf(schema)
    return (types.has('object') || types.has('array')) && !types.has('string')
}

function renameAliasedKeys({ value, properties, required }: { value: Record<string, unknown>, properties: Record<string, unknown>, required: string[] }): Record<string, unknown> {
    const undeclared = Object.keys(value).filter((key) => !(key in properties))
    const renames = required
        .filter((missing) => !(missing in value))
        .map((missing) => ({ missing, matches: undeclared.filter((key) => namesAlias({ a: key, b: missing })) }))
        .filter(({ matches }) => matches.length === 1)
        .map(({ missing, matches }) => ({ from: matches[0], to: missing }))
    if (renames.length === 0) {
        return value
    }
    const renamedFrom = new Set(renames.map(({ from }) => from))
    return {
        ...Object.fromEntries(Object.entries(value).filter(([key]) => !renamedFrom.has(key))),
        ...Object.fromEntries(renames.map(({ from, to }) => [to, value[from]])),
    }
}

function namesAlias({ a, b }: { a: string, b: string }): boolean {
    const left = a.toLowerCase()
    const right = b.toLowerCase()
    return left !== right && Math.min(left.length, right.length) >= MIN_ALIAS_LENGTH && (left.endsWith(right) || right.endsWith(left))
}

function normalizeArray({ value, schema, depth }: { value: unknown, schema: Record<string, unknown>, depth: number }): unknown {
    const items = schema['items']
    const asArray = toArray(value)
    if (isNil(asArray)) {
        return value
    }
    return asArray.map((entry) => normalizeValue({ value: entry, schema: items, depth: depth + 1 }))
}

function toArray(value: unknown): unknown[] | undefined {
    if (Array.isArray(value)) {
        return value
    }
    if (typeof value === 'string') {
        const parsed = parseJson(value)
        return Array.isArray(parsed) ? parsed : undefined
    }
    if (isObject(value)) {
        const keys = Object.keys(value)
        if (keys.length === 1 && ITEM_WRAPPER_KEYS.has(keys[0])) {
            const inner = value[keys[0]]
            return Array.isArray(inner) ? inner : [inner]
        }
    }
    return undefined
}

function normalizeScalar({ value, types }: { value: unknown, types: Set<string> }): unknown {
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (types.has('boolean') && (trimmed === 'true' || trimmed === 'false')) {
            return trimmed === 'true'
        }
        if ((types.has('integer') || types.has('number')) && NUMERIC_PATTERN.test(trimmed)) {
            const parsed = Number(trimmed)
            return types.has('integer') && !types.has('number') && !Number.isInteger(parsed) ? value : parsed
        }
        return value
    }
    if ((typeof value === 'number' || typeof value === 'boolean') && types.has('string') && !types.has('number') && !types.has('integer') && !types.has('boolean')) {
        return String(value)
    }
    return value
}

function schemaVariants(schema: Record<string, unknown>): Record<string, unknown>[] {
    const raw = Array.isArray(schema['anyOf']) ? schema['anyOf'] : Array.isArray(schema['oneOf']) ? schema['oneOf'] : []
    return raw.filter((variant): variant is Record<string, unknown> => isObject(variant) && !isNullSchema(variant))
}

function isNullSchema(schema: Record<string, unknown>): boolean {
    return schema['type'] === 'null'
}

function typesOf(schema: Record<string, unknown>): Set<string> {
    const declared = schema['type']
    const types = new Set(Array.isArray(declared) ? declared.filter((t): t is string => typeof t === 'string') : typeof declared === 'string' ? [declared] : [])
    if (types.size === 0 && isObject(schema['properties'])) {
        types.add('object')
    }
    if (types.size === 0 && !isNil(schema['items'])) {
        types.add('array')
    }
    return types
}

function matchesType({ value, types }: { value: unknown, types: Set<string> }): boolean {
    if (types.size === 0) {
        return true
    }
    if (Array.isArray(value)) {
        return types.has('array')
    }
    if (isObject(value)) {
        return types.has('object')
    }
    if (typeof value === 'number') {
        return types.has('number') || (types.has('integer') && Number.isInteger(value))
    }
    return types.has(typeof value)
}

function parseJson(text: string): unknown {
    const trimmed = text.trim()
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        return undefined
    }
    return tryCatchSync((): unknown => JSON.parse(trimmed)).data ?? undefined
}

const MAX_DEPTH = 12
const MIN_ALIAS_LENGTH = 4
const ENVELOPE_KEYS = new Set(['input', 'arguments', 'args', 'parameters', 'params'])
const ITEM_WRAPPER_KEYS = new Set(['item', 'items'])
const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/

export const toolInputNormalizer = {
    normalize,
    normalizeJsonText,
}
