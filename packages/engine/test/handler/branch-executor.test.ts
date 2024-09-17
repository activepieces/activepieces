/* eslint-disable @typescript-eslint/no-explicit-any */
import { BranchCondition, BranchOperator } from '@activepieces/shared'
import { evaluateConditions } from '../../src/lib/handler/branch-executor'

describe('Branch evaluateConditions', () => {
    describe('DATE_IS_AFTER', () => {
        test.each([
            null,
            undefined,
            'not a date',
        ])('should return false when one of the values is not a date %p', (value) => {
            const condition: BranchCondition = {
                firstValue: value as string,
                secondValue: '2021-01-01',
                operator: BranchOperator.DATE_IS_AFTER,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })

        test('should return true when first date is after second date', () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-02',
                secondValue: '2021-01-01',
                operator: BranchOperator.DATE_IS_AFTER,
            }

            expect(evaluateConditions([[condition]])).toEqual(true)
        })

        test.each([
            '2021-01-01',
            '2021-01-02',
        ])('should return false when first date is before or equal to second date', (firstDate) => {
            const condition: BranchCondition = {
                firstValue: firstDate,
                secondValue: '2021-01-02',
                operator: BranchOperator.DATE_IS_AFTER,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })

        test('should return false when the date is not in a supported format', () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-02T00:00:00Z',
                secondValue: '1st January 2021',
                operator: BranchOperator.DATE_IS_AFTER,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })

        test('should compare time', () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-01T00:00:02Z',
                secondValue: '2021-01-01T00:00:01Z',
                operator: BranchOperator.DATE_IS_AFTER,
            }

            expect(evaluateConditions([[condition]])).toEqual(true)
        })
    })

    describe('DATE_IS_BEFORE', () => {
        test.each([
            null,
            undefined,
            'not a date',
        ])('should return false when one of the values is not a date %p', (value) => {
            const condition: BranchCondition = {
                firstValue: value as string,
                secondValue: '2021-01-01',
                operator: BranchOperator.DATE_IS_BEFORE,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })

        test('should return true when first date is before second date', () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-01',
                secondValue: '2021-01-02',
                operator: BranchOperator.DATE_IS_BEFORE,
            }

            expect(evaluateConditions([[condition]])).toEqual(true)
        })

        test.each([
            '2021-01-01',
            '2021-01-02',
        ])('should return false when first date is after or equal to second date', (firstDate) => {
            const condition: BranchCondition = {
                firstValue: firstDate,
                secondValue: '2021-01-01',
                operator: BranchOperator.DATE_IS_BEFORE,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })

        test('should return false when the date is not in a supported format', () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-02T00:00:00Z',
                secondValue: '2nd January 2021',
                operator: BranchOperator.DATE_IS_BEFORE,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })

        test('should compare time', () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-01T00:00:01Z',
                secondValue: '2021-01-01T00:00:02Z',
                operator: BranchOperator.DATE_IS_BEFORE,
            }

            expect(evaluateConditions([[condition]])).toEqual(true)
        })
    })

    describe('DATE_IS_EQUAL', () => {
        test.each([
            null,
            undefined,
            'not a date',
        ])('should return false when one of the values is not a date %p', (value) => {
            const condition: BranchCondition = {
                firstValue: value as string,
                secondValue: '2021-01-01',
                operator: BranchOperator.DATE_IS_EQUAL,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })

        test('should return true when first date is equal to second date', () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-01',
                secondValue: '2021-01-01',
                operator: BranchOperator.DATE_IS_EQUAL,
            }

            expect(evaluateConditions([[condition]])).toEqual(true)
        })

        test.each([
            '2021-01-01',
            '2021-01-03',
        ])('should return false when first date is after or before the second date', (firstDate) => {
            const condition: BranchCondition = {
                firstValue: firstDate,
                secondValue: '2021-01-02',
                operator: BranchOperator.DATE_IS_EQUAL,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })

        test('should return false when the date is not in a supported format', () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-02T00:00:00Z',
                secondValue: '2nd January 2021',
                operator: BranchOperator.DATE_IS_EQUAL,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })

        test('should compare time', () => {
            const condition: BranchCondition = {
                firstValue: '2021-01-01T00:00:01Z',
                secondValue: '2021-01-01T00:00:01Z',
                operator: BranchOperator.DATE_IS_EQUAL,
            }

            expect(evaluateConditions([[condition]])).toEqual(true)
        })
    })

    describe('LIST_IS_EMPTY', () => {
        test.each([
            [],
            '[]',
        ])('should return true when list is empty %p', (input: any) => {
            const condition: BranchCondition = {
                firstValue: input,
                operator: BranchOperator.LIST_IS_EMPTY,
            }

            expect(evaluateConditions([[condition]])).toEqual(true)
        })

        test.each([
            [1],
            '[1]',
        ])('should return false when list is not empty %p', (input: any) => {
            const condition: BranchCondition = {
                firstValue: input,
                operator: BranchOperator.LIST_IS_EMPTY,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })

        test.each([
            null,
            undefined,
            'not a list',
            {},
        ])('should return false when the value is not a list %p', (input: any) => {
            const condition: BranchCondition = {
                firstValue: input,
                operator: BranchOperator.LIST_IS_EMPTY,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })
    })

    describe('LIST_IS_NOT_EMPTY', () => {
        test.each([
            [1],
            '[1]',
        ])('should return true when list is not empty %p', (input: any) => {
            const condition: BranchCondition = {
                firstValue: input,
                operator: BranchOperator.LIST_IS_NOT_EMPTY,
            }

            expect(evaluateConditions([[condition]])).toEqual(true)
        })

        test.each([
            [],
            '[]',
        ])('should return false when list is empty %p', (input: any) => {
            const condition: BranchCondition = {
                firstValue: input,
                operator: BranchOperator.LIST_IS_NOT_EMPTY,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })

        test.each([
            null,
            undefined,
            'not a list',
            {},
        ])('should return false when the value is not a list %p', (input: any) => {
            const condition: BranchCondition = {
                firstValue: input,
                operator: BranchOperator.LIST_IS_NOT_EMPTY,
            }

            expect(evaluateConditions([[condition]])).toEqual(false)
        })
    })
})
