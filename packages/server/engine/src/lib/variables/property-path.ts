import { isNil } from '@activepieces/core-utils'

export const propertyPath = {
    parse(expression: string): string[] | null {
        if (!PATH_PATTERN.test(expression)) {
            return null
        }
        const segments: string[] = []
        for (const match of expression.matchAll(SEGMENT_PATTERN)) {
            const segment = extractSegment(match)
            if (BLOCKED_SEGMENTS.has(segment)) {
                return null
            }
            segments.push(segment)
        }
        return segments
    },

    resolveValue({ segments, scope }: ResolveValueParams): unknown {
        let current: unknown = scope
        for (const segment of segments) {
            if (isNil(current)) {
                return undefined
            }
            current = Reflect.get(Object(current), segment)
        }
        return current
    },
}

function extractSegment(match: RegExpMatchArray): string {
    const [full, index, singleQuoted, doubleQuoted] = match
    if (!isNil(index)) {
        return index
    }
    if (!isNil(singleQuoted)) {
        return unescapeQuoted(singleQuoted)
    }
    if (!isNil(doubleQuoted)) {
        return unescapeQuoted(doubleQuoted)
    }
    return full
}

function unescapeQuoted(segment: string): string {
    return segment.replace(/\\(.)/g, '$1')
}

const PATH_PATTERN = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[(?:\d+|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")\])*$/
const SEGMENT_PATTERN = /\[(\d+)\]|\['((?:[^'\\]|\\.)*)'\]|\["((?:[^"\\]|\\.)*)"\]|[A-Za-z_$][\w$]*/g
const BLOCKED_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype'])

type ResolveValueParams = {
    segments: string[]
    scope: Record<string, unknown>
}
