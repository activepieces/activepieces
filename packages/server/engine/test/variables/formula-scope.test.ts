import { formulaEvaluator } from '@activepieces/core-formula'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { createPropsResolver } from '../../src/lib/variables/props-resolver'

const propsResolverService = createPropsResolver({
    projectId: 'PROJECT_ID',
    engineToken: 'WORKER_TOKEN',
    apiUrl: 'http://127.0.0.1:3000',
    contextVersion: LATEST_CONTEXT_VERSION,
    stepNames: ['trigger'],
})

let prototypeKeysBefore: string[] = []

beforeEach(() => {
    prototypeKeysBefore = Object.getOwnPropertyNames(Object.prototype).sort()
})

afterEach(() => {
    const leakedMarker = Reflect.get(globalThis, MARKER)
    Reflect.deleteProperty(globalThis, MARKER)
    const addedPrototypeKeys = Object.getOwnPropertyNames(Object.prototype).filter((key) => !prototypeKeysBefore.includes(key))
    addedPrototypeKeys.forEach((key) => Reflect.deleteProperty(Object.prototype, key))
    expect(addedPrototypeKeys).toEqual([])
    expect(leakedMarker).toBeUndefined()
})

describe('formula scope', () => {
    test.each([
        ['list helper returning Object', `((first_item(pluck([{"a":1}]; "constructor"))).getOwnPropertyDescriptor((first_item(pluck([{"a":1}]; "constructor"))).getPrototypeOf(uppercase); "constructor")).value("${SET_MARKER}")()`],
        ['assigned constructor', `((x = constructor).getOwnPropertyDescriptor(x.__proto__, "constructor")).value("${SET_MARKER}")()`],
        ['assigned constructor with prototype write', `(o = constructor) ? (o.assign(__proto__, o.getOwnPropertyDescriptor(o.getPrototypeOf(toString), "constructor")) ? value("delete Object.prototype.value; ${SET_MARKER}")() : 0) : 0`],
    ])('refuses to run code through %s', async (_name, expression) => {
        await expect(propsResolverService.resolve({
            unresolvedInput: formulaEvaluator.wrap(expression),
            executionState: FlowExecutorContext.empty(),
        })).rejects.toThrow(/Formula error/)
    })

    test.each(['constructor', '__proto__', 'toString', 'hasOwnProperty', '__defineGetter__', 'constructor 1', 'valueOf(1)', 'x = constructor', '__proto__ = 1'])('does not resolve inherited name in %s', (expression) => {
        const { result, error } = evaluate({ expression })
        expect(result).toBeNull()
        expect(error).not.toBeNull()
    })

    test.each(['uppercase.constructor', '"abc".constructor', 'f(x) = x; f(1)'])('rejects %s', (expression) => {
        expect(evaluate({ expression }).error).not.toBeNull()
    })

    test.each(['pluck', 'filter_list', 'sort_list', 'deduplicate', 'sum', 'average', 'max_in_list', 'min_in_list'])('%s ignores inherited keys', (fn) => {
        const args = fn === 'filter_list' ? '[{"a":1}]; "constructor"; "x"' : '[{"a":1},{"a":2}]; "constructor"'
        const { result, error } = evaluate({ expression: `${fn}(${args})` })
        expect(error).toBeNull()
        expect(containsFunction(result)).toBe(false)
    })

    test('list helpers still read own keys named like inherited ones', () => {
        expect(evaluate({ expression: 'pluck([{"constructor":"x"},{"toString":"y"}]; "constructor")' }).result).toEqual(['x', undefined])
    })

    test.each(['{{user.constructor}}', '{{user.__proto__}}', '{{user.toString}}', '{{constructor}}', '{{user.constructor.constructor}}'])('mention %s does not expose inherited values', (expression) => {
        const { result } = evaluate({ expression, sampleData: { user: { name: 'Ada' } } })
        expect(containsFunction(result)).toBe(false)
        expect(result).not.toBe(Object.prototype)
    })

    test('mentions still read own keys named like inherited ones', () => {
        expect(evaluate({ expression: 'uppercase({{user.constructor}})', sampleData: { user: { constructor: 'own value' } } }).result).toBe('OWN VALUE')
    })

    test('unknown names report the name', () => {
        expect(evaluate({ expression: 'tickets' }).error).toBe('"tickets" is not a known function or variable — check for typos')
    })

    test.each([
        ['map(uppercase, ["a", "b"])', ['A', 'B']],
        ['fold(add, 0, [1, 2, 3])', 6],
        ['floor(2.7) + abs(-1)', 3],
        ['if({{age}} >= 18; "adult"; "minor")', 'adult'],
        ['pluck({{orders}}; "total")', [10, 20]],
        ['true ? 1 : unknown_name', 1],
        ['map(!, [3])', [6]],
        ['x = 1', 1],
    ])('keeps %s working', (expression, expected) => {
        expect(evaluate({ expression, sampleData: { age: 30, orders: [{ total: 10 }, { total: 20 }] } }).result).toEqual(expected)
    })
})

function evaluate({ expression, sampleData = {} }: { expression: string, sampleData?: Record<string, unknown> }): ReturnType<typeof formulaEvaluator.evaluate> {
    return formulaEvaluator.evaluate({ expression: formulaEvaluator.wrap(expression), sampleData })
}

function containsFunction(value: unknown): boolean {
    if (typeof value === 'function') {
        return true
    }
    if (value === null || typeof value !== 'object') {
        return false
    }
    return Object.values(value).some(containsFunction)
}

const MARKER = '__formula_scope_marker'
const SET_MARKER = `globalThis.${MARKER} = 1; return 1`
