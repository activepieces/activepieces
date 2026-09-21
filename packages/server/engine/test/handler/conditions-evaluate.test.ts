/* eslint-disable @typescript-eslint/no-explicit-any */
import { BranchCondition, BranchOperator } from '@activepieces/shared'
import { vi } from 'vitest'
import { evaluateConditions } from '../../src/lib/handler/router-executor'

const TEST_CONSTANTS = {
    internalApiUrl: 'http://localhost:3000/',
    engineToken: 'test-engine-token',
}

describe('Branch evaluateConditions', () => {
    describe('DATE_IS_AFTER', () => {
        test.each([
            null,
            undefined,
            'not a date',
        ])('should return false when one of the values is not a date %p', async (value) => {
            const condition: BranchCondition = {
                firstValue: value as string,
                secondValue: '2021-01-01',
                operator: BranchOperator.DATE_IS_AFTER,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })

        test('should return true when first date is after second date', async () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-02',
                secondValue: '2021-01-01',
                operator: BranchOperator.DATE_IS_AFTER,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(true)
        })

        test.each([
            '2021-01-01',
            '2021-01-02',
        ])('should return false when first date is before or equal to second date', async (firstDate) => {
            const condition: BranchCondition = {
                firstValue: firstDate,
                secondValue: '2021-01-02',
                operator: BranchOperator.DATE_IS_AFTER,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })

        test('should return false when the date is not in a supported format', async () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-02T00:00:00Z',
                secondValue: '1st January 2021',
                operator: BranchOperator.DATE_IS_AFTER,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })

        test('should compare time', async () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-01T00:00:02Z',
                secondValue: '2021-01-01T00:00:01Z',
                operator: BranchOperator.DATE_IS_AFTER,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(true)
        })
    })

    describe('DATE_IS_BEFORE', () => {
        test.each([
            null,
            undefined,
            'not a date',
        ])('should return false when one of the values is not a date %p', async (value) => {
            const condition: BranchCondition = {
                firstValue: value as string,
                secondValue: '2021-01-01',
                operator: BranchOperator.DATE_IS_BEFORE,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })

        test('should return true when first date is before second date', async () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-01',
                secondValue: '2021-01-02',
                operator: BranchOperator.DATE_IS_BEFORE,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(true)
        })

        test.each([
            '2021-01-01',
            '2021-01-02',
        ])('should return false when first date is after or equal to second date', async (firstDate) => {
            const condition: BranchCondition = {
                firstValue: firstDate,
                secondValue: '2021-01-01',
                operator: BranchOperator.DATE_IS_BEFORE,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })

        test('should return false when the date is not in a supported format', async () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-02T00:00:00Z',
                secondValue: '2nd January 2021',
                operator: BranchOperator.DATE_IS_BEFORE,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })

        test('should compare time', async () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-01T00:00:01Z',
                secondValue: '2021-01-01T00:00:02Z',
                operator: BranchOperator.DATE_IS_BEFORE,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(true)
        })
    })

    describe('DATE_IS_EQUAL', () => {
        test.each([
            null,
            undefined,
            'not a date',
        ])('should return false when one of the values is not a date %p', async (value) => {
            const condition: BranchCondition = {
                firstValue: value as string,
                secondValue: '2021-01-01',
                operator: BranchOperator.DATE_IS_EQUAL,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })

        test('should return true when first date is equal to second date', async () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-01',
                secondValue: '2021-01-01',
                operator: BranchOperator.DATE_IS_EQUAL,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(true)
        })

        test.each([
            '2021-01-01',
            '2021-01-03',
        ])('should return false when first date is after or before the second date', async (firstDate) => {
            const condition: BranchCondition = {
                firstValue: firstDate,
                secondValue: '2021-01-02',
                operator: BranchOperator.DATE_IS_EQUAL,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })

        test('should return false when the date is not in a supported format', async () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-02T00:00:00Z',
                secondValue: '2nd January 2021',
                operator: BranchOperator.DATE_IS_EQUAL,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })

        test('should compare time', async () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-01T00:00:01Z',
                secondValue: '2021-01-01T00:00:01Z',
                operator: BranchOperator.DATE_IS_EQUAL,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(true)
        })
    })

    describe('LIST_IS_EMPTY', () => {
        test.each([
            [],
            '[]',
        ])('should return true when list is empty %p', async (input: any) => {
            const condition: BranchCondition = {
                firstValue: input,
                operator: BranchOperator.LIST_IS_EMPTY,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(true)
        })

        test.each([
            [1],
            '[1]',
        ])('should return false when list is not empty %p', async (input: any) => {
            const condition: BranchCondition = {
                firstValue: input,
                operator: BranchOperator.LIST_IS_EMPTY,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })

        test.each([
            null,
            undefined,
            'not a list',
            {},
        ])('should return false when the value is not a list %p', async (input: any) => {
            const condition: BranchCondition = {
                firstValue: input,
                operator: BranchOperator.LIST_IS_EMPTY,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })
    })

    describe('LIST_IS_NOT_EMPTY', () => {
        test.each([
            [1],
            '[1]',
        ])('should return true when list is not empty %p', async (input: any) => {
            const condition: BranchCondition = {
                firstValue: input,
                operator: BranchOperator.LIST_IS_NOT_EMPTY,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(true)
        })

        test.each([
            [],
            '[]',
        ])('should return false when list is empty %p', async (input: any) => {
            const condition: BranchCondition = {
                firstValue: input,
                operator: BranchOperator.LIST_IS_NOT_EMPTY,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })

        test.each([
            null,
            undefined,
            'not a list',
            {},
        ])('should return false when the value is not a list %p', async (input: any) => {
            const condition: BranchCondition = {
                firstValue: input,
                operator: BranchOperator.LIST_IS_NOT_EMPTY,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(false)
        })
    })

    describe('LIST_CONTAINS', () => {
        test.each([
            { expected: true, list: ['apple', 'banana', 'cherry'], value: 'banana', caseSensitive: false },
            { expected: false, list: ['apple', 'banana', 'cherry'], value: 'Banana', caseSensitive: true },
            { expected: true, list: ['apple', 'banana', 'cherry'], value: 'Banana', caseSensitive: false },
            { expected: true, list: '["apple", "banana", "cherry"]', value: 'banana', caseSensitive: false },
            { expected: true, list: 'apple', value: 'apple', caseSensitive: false },
            { expected: true, list: [1, 2, 3, 4, 5], value: '4', caseSensitive: false },
            { expected: true, list: [1, 2, 3, 4, 5], value: 4, caseSensitive: false },
            { expected: true, list: [true, false, true], value: 'true', caseSensitive: false },
            { expected: true, list: [true, false, true], value: true, caseSensitive: false },
            { expected: true, list: ['true', 'false', 'true'], value: true, caseSensitive: false },
            { expected: true, list: ['true', 'false', 'true'], value: 'true', caseSensitive: false },
        ])('should return $expected for list $list containing $value (case sensitive: $caseSensitive)', async ({ expected, list, value, caseSensitive }) => {
            const condition: BranchCondition = {
                firstValue: list as any,
                secondValue: value as any,
                operator: BranchOperator.LIST_CONTAINS,
                caseSensitive,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(expected)
        })
    })

    describe('LIST_DOES_NOT_CONTAIN', () => {
        test.each([
            { expected: true, list: ['apple', 'banana', 'cherry'], value: 'grape', caseSensitive: false },
            { expected: true, list: ['apple', 'banana', 'cherry'], value: 'Banana', caseSensitive: true },
            { expected: false, list: ['apple', 'banana', 'cherry'], value: 'Banana', caseSensitive: false },
            { expected: true, list: '["apple", "banana", "cherry"]', value: 'grape', caseSensitive: false },
            { expected: true, list: 'apple', value: 'grape', caseSensitive: false },
            { expected: true, list: [1, 2, 3, 4, 5], value: '6', caseSensitive: false },
            { expected: true, list: [1, 2, 3, 4, 5], value: 6, caseSensitive: false },
            { expected: false, list: [true, false, true], value: 'false', caseSensitive: false },
            { expected: false, list: [true, false, true], value: false, caseSensitive: false },
            { expected: false, list: ['true', 'false', 'true'], value: false, caseSensitive: false },
            { expected: false, list: ['true', 'false', 'true'], value: 'false', caseSensitive: false },
        ])('should return $expected for list $list not containing $value (case sensitive: $caseSensitive)', async ({ expected, list, value, caseSensitive }) => {
            const condition: BranchCondition = {
                firstValue: list as any,
                secondValue: value as any,
                operator: BranchOperator.LIST_DOES_NOT_CONTAIN,
                caseSensitive,
            }

            expect(await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).toEqual(expected)
        })
    })

    describe('AI_MATCHES', () => {
        const aiCondition = (threshold?: number): BranchCondition => ({
            firstValue: 'I want my 400 pound order refunded',
            secondValue: 'Is this refund request above our policy limit?',
            operator: BranchOperator.AI_MATCHES,
            ...(threshold === undefined ? {} : { threshold }),
        })

        const respondWith = (probability: number) => vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ probability }),
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })

        test('should take the branch when the probability reaches the threshold', async () => {
            global.fetch = respondWith(0.82)

            const result = await evaluateConditions({ conditionGroups: [[aiCondition(0.7)]], constants: TEST_CONSTANTS })

            expect(result).toEqual(true)
        })

        test('should skip the branch when the probability is below the threshold', async () => {
            global.fetch = respondWith(0.42)

            const result = await evaluateConditions({ conditionGroups: [[aiCondition(0.7)]], constants: TEST_CONSTANTS })

            expect(result).toEqual(false)
        })

        test('should fall back to the default threshold when none is set', async () => {
            global.fetch = respondWith(0.6)

            const result = await evaluateConditions({ conditionGroups: [[aiCondition()]], constants: TEST_CONSTANTS })

            expect(result).toEqual(true)
        })

        test('should fail the condition rather than take a branch when the call is not ok', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable' })

            await expect(evaluateConditions({ conditionGroups: [[aiCondition()]], constants: TEST_CONSTANTS })).rejects.toMatchObject({ name: 'AiConditionEvaluationError' })
        })

        test('should fail the condition when the call cannot be reached', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('aborted'))

            await expect(evaluateConditions({ conditionGroups: [[aiCondition()]], constants: TEST_CONSTANTS })).rejects.toMatchObject({ name: 'AiConditionEvaluationError' })
        })

        test('should send a non-string resolved value as text rather than failing validation', async () => {
            const fetchMock = respondWith(0.9)
            global.fetch = fetchMock
            const condition = {
                firstValue: { total: 400, currency: 'GBP' },
                secondValue: 'Is this above our policy limit?',
                operator: BranchOperator.AI_MATCHES,
            } as unknown as BranchCondition

            await evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })

            const body = JSON.parse(fetchMock.mock.calls[0][1].body)
            expect(body.text).toEqual('{"total":400,"currency":"GBP"}')
            expect(typeof body.text).toEqual('string')
        })

        test('should not call the model when a cheaper condition in the same group already failed', async () => {
            const fetchMock = respondWith(0.99)
            global.fetch = fetchMock
            const cheapCondition: BranchCondition = {
                firstValue: 'hello',
                secondValue: 'goodbye',
                operator: BranchOperator.TEXT_CONTAINS,
            }

            const result = await evaluateConditions({ conditionGroups: [[cheapCondition, aiCondition()]], constants: TEST_CONSTANTS })

            expect(result).toEqual(false)
            expect(fetchMock).not.toHaveBeenCalled()
        })
    })

    describe('unknown operator', () => {
        test('should throw rather than silently take the branch', async () => {
            const condition = {
                firstValue: 'anything',
                secondValue: 'anything',
                operator: 'OPERATOR_FROM_A_NEWER_RELEASE',
            } as unknown as BranchCondition

            await expect(evaluateConditions({ conditionGroups: [[condition]], constants: TEST_CONSTANTS })).rejects.toMatchObject({ name: 'UnknownOperatorError' })
        })
    })

})
