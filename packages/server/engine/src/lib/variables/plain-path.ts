/**
 * Fast path for resolving plain property-access tokens (`{{step_1.output.items}}`,
 * `{{trigger.output['rows'][0]}}`) without handing the token to `evalInScope`/`runScript`.
 *
 * Two independent layers, mirroring the resolver's observable behavior:
 *   1. `parseToken` — a linear (ReDoS-safe) tokenizer that returns the path segments only
 *      when the token is provably pure member access. Anything else (operators, calls,
 *      whitespace, escapes, `flattenNestedKeys(...)`) returns null → the caller falls back
 *      to the existing eval path. This is a fail-CLOSED gate: the default is always the old path.
 *   2. `resolve` — an own-property-only walk of the state object. It never reads inherited
 *      properties and never invokes anything; a value that is a function is returned as-is.
 *
 * Parity notes (intentional deviations, all in the safe direction):
 *   - Blocklisted segments (`__proto__`, `constructor`, `prototype`) resolve to '' even under the
 *     no-op sandbox where eval would otherwise expose live host objects — a deliberate hardening.
 *   - Inherited keys (e.g. `.toString`) resolve to '' rather than the inherited function.
 *   - A `miss` result means "not decidable here, fall back to eval" (used for JS globals/literals
 *     like `{{Math.PI}}`/`{{true}}` and for boxed-primitive property access like a string's `.length`).
 */

const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
const MAX_INDEX_DIGITS = 15

function isIdentifierStart(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_' || char === '$'
}

function isIdentifierPart(char: string): boolean {
    return isIdentifierStart(char) || (char >= '0' && char <= '9')
}

function isDigit(char: string): boolean {
    return char >= '0' && char <= '9'
}

function parseToken(token: string): string[] | null {
    const length = token.length
    if (length === 0 || !isIdentifierStart(token[0])) {
        return null
    }
    const segments: string[] = []
    let index = 1
    while (index < length && isIdentifierPart(token[index])) {
        index++
    }
    segments.push(token.slice(0, index))

    while (index < length) {
        const char = token[index]
        if (char === '.') {
            index++
            if (index >= length || !isIdentifierStart(token[index])) {
                return null
            }
            const start = index
            index++
            while (index < length && isIdentifierPart(token[index])) {
                index++
            }
            segments.push(token.slice(start, index))
        }
        else if (char === '[') {
            index++
            if (index >= length) {
                return null
            }
            const quote = token[index]
            if (quote === '\'' || quote === '"') {
                index++
                const start = index
                while (index < length && token[index] !== quote) {
                    if (token[index] === '\\') {
                        return null
                    }
                    index++
                }
                if (index >= length) {
                    return null
                }
                const key = token.slice(start, index)
                index++
                if (index >= length || token[index] !== ']') {
                    return null
                }
                index++
                segments.push(key)
            }
            else if (isDigit(quote)) {
                const start = index
                if (quote === '0') {
                    index++
                }
                else {
                    index++
                    while (index < length && isDigit(token[index])) {
                        index++
                    }
                }
                const digits = token.slice(start, index)
                if (digits.length > MAX_INDEX_DIGITS || index >= length || token[index] !== ']') {
                    return null
                }
                index++
                segments.push(digits)
            }
            else {
                return null
            }
        }
        else {
            return null
        }
    }
    return segments
}

function resolve({ segments, root }: { segments: string[], root: Record<string, unknown> }): PlainPathResult {
    let current: unknown = root
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        if (BLOCKED_KEYS.has(segment)) {
            return { kind: 'hit', value: '' }
        }
        if (i === 0) {
            if (!Object.prototype.hasOwnProperty.call(root, segment)) {
                return { kind: 'miss' }
            }
            current = root[segment]
            continue
        }
        if (isNilValue(current)) {
            return { kind: 'hit', value: '' }
        }
        if (typeof current !== 'object') {
            return { kind: 'miss' }
        }
        if (!Object.prototype.hasOwnProperty.call(current, segment)) {
            return { kind: 'hit', value: '' }
        }
        current = (current as Record<string, unknown>)[segment]
    }
    return { kind: 'hit', value: current ?? '' }
}

function isNilValue(value: unknown): boolean {
    return value === null || value === undefined
}

export const plainPath = {
    parseToken,
    resolve,
}

export type PlainPathResult =
    | { kind: 'hit', value: unknown }
    | { kind: 'miss' }
