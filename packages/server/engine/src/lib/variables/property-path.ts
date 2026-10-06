import { isNil, tryCatchSync } from '@activepieces/core-utils'
import jsep from 'jsep'

export const propertyPath = {
    parse(expression: string): string[] | null {
        const { data: ast } = tryCatchSync(() => jsep(expression))
        if (isNil(ast)) {
            return null
        }
        return collectSafeSegments(ast)
    },

    parseFlattenNestedKeysCall(expression: string): FlattenNestedKeysCall | null {
        const { data: ast } = tryCatchSync(() => jsep(expression))
        if (isNil(ast) || !isFlattenNestedKeysCall(ast)) {
            return null
        }
        const [target, keysNode] = ast.arguments
        const segments = collectSafeSegments(target)
        const keys = collectStringLiterals(keysNode)
        if (isNil(segments) || isNil(keys)) {
            return null
        }
        return { segments, keys }
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

    flattenAsJson({ value, keys }: FlattenAsJsonParams): unknown[] {
        const json = toJsonValue(value)
        if (Array.isArray(json)) {
            return json.flatMap((item) => propertyPath.flattenAsJson({ value: isDroppedByJson(item) ? null : item, keys }))
        }
        if (typeof json === 'object' && json !== null) {
            const [head, ...rest] = keys
            const match = Object.entries(json).find(([key, child]) => key === head && !isDroppedByJson(child))
            return isNil(match) ? [] : propertyPath.flattenAsJson({ value: match[1], keys: rest })
        }
        return keys.length === 0 ? [json] : []
    },
}

function toJsonValue(value: unknown): unknown {
    if (typeof value === 'object' && value !== null && 'toJSON' in value && typeof value.toJSON === 'function') {
        return toJsonValue(value.toJSON())
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
        return null
    }
    return value
}

function isDroppedByJson(value: unknown): boolean {
    return value === undefined || typeof value === 'function' || typeof value === 'symbol'
}

function collectSafeSegments(node: jsep.Expression): string[] | null {
    const segments = collectSegments(node)
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
}

function isFlattenNestedKeysCall(node: jsep.Expression): node is jsep.CallExpression {
    return isCallExpression(node) && isIdentifier(node.callee) && node.callee.name === 'flattenNestedKeys' && node.arguments.length === 2
}

function collectStringLiterals(node: jsep.Expression): string[] | null {
    if (!isArrayExpression(node)) {
        return null
    }
    const keys: string[] = []
    for (const element of node.elements) {
        if (isNil(element) || !isLiteral(element) || typeof element.value !== 'string' || UNDECODED_ESCAPE.test(element.raw)) {
            return null
        }
        keys.push(element.value)
    }
    return keys
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

function isCallExpression(node: jsep.Expression): node is jsep.CallExpression {
    return node.type === 'CallExpression'
}

function isArrayExpression(node: jsep.Expression): node is jsep.ArrayExpression {
    return node.type === 'ArrayExpression'
}

const UNDECODED_ESCAPE = /\\[ux0-9\r\n\u2028\u2029]/
const BLOCKED_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype'])
const LITERAL_KEYWORDS = new Set(['undefined', 'NaN', 'Infinity'])

type FlattenAsJsonParams = {
    value: unknown
    keys: string[]
}

type FlattenNestedKeysCall = {
    segments: string[]
    keys: string[]
}

type ResolveValueParams = {
    segments: string[]
    scope: Record<string, unknown>
}
