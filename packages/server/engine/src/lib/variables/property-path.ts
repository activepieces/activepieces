import { isNil, tryCatchSync } from '@activepieces/core-utils'
import jsep from 'jsep'

export const propertyPath = {
    parse(expression: string): string[] | null {
        const { data: ast } = tryCatchSync(() => jsep(expression))
        if (isNil(ast)) {
            return null
        }
        const segments = collectSegments(ast)
        if (isNil(segments)) {
            return null
        }
        if (LITERAL_KEYWORDS.has(segments[0])) {
            return null
        }
        if (segments.some((segment) => BLOCKED_SEGMENTS.has(segment))) {
            return null
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

function collectSegments(node: jsep.Expression): string[] | null {
    if (isIdentifier(node)) {
        return [node.name]
    }
    if (!isMemberExpression(node)) {
        return null
    }
    const objectSegments = collectSegments(node.object)
    if (isNil(objectSegments)) {
        return null
    }
    const key = extractKey(node)
    if (isNil(key)) {
        return null
    }
    return [...objectSegments, key]
}

function extractKey(member: jsep.MemberExpression): string | null {
    if (!member.computed) {
        return isIdentifier(member.property) ? member.property.name : null
    }
    if (!isLiteral(member.property)) {
        return null
    }
    const { value, raw } = member.property
    if (typeof value === 'number') {
        return String(value)
    }
    if (typeof value !== 'string') {
        return null
    }
    return UNDECODED_ESCAPE.test(raw) ? null : value
}

function isIdentifier(node: jsep.Expression): node is jsep.Identifier {
    return node.type === 'Identifier'
}

function isMemberExpression(node: jsep.Expression): node is jsep.MemberExpression {
    return node.type === 'MemberExpression'
}

function isLiteral(node: jsep.Expression): node is jsep.Literal {
    return node.type === 'Literal'
}

const UNDECODED_ESCAPE = /\\[ux0-9\r\n\u2028\u2029]/
const BLOCKED_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype'])
const LITERAL_KEYWORDS = new Set(['undefined', 'NaN', 'Infinity'])

type ResolveValueParams = {
    segments: string[]
    scope: Record<string, unknown>
}
