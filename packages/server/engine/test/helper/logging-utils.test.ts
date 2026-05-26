import {
    FlowActionType,
    GenericStepOutput,
    StepOutputStatus,
} from '@activepieces/shared'
import { loggingUtils } from '../../src/lib/helper/logging-utils'

describe('loggingUtils.maybeTruncateInput', () => {
    const threshold = 2 * 1024

    it('returns input unchanged when every value is within the threshold', () => {
        const input = { a: 'small', b: { nested: 1 }, c: [1, 2, 3] }
        const result = loggingUtils.maybeTruncateInput(input, threshold)
        expect(result).toBe(input)
    })

    it('replaces over-threshold top-level values with a sized placeholder', () => {
        const large = 'x'.repeat(4096)
        const input = { keep: 'small', drop: large }
        const result = loggingUtils.maybeTruncateInput(input, threshold)
        expect(result).toEqual({
            keep: 'small',
            drop: expect.stringMatching(/^\(truncated, original size \d+ KB\)$/),
        })
    })

    it('does not recurse into nested objects', () => {
        const large = 'x'.repeat(4096)
        const input = { outer: { inner: large } }
        const result = loggingUtils.maybeTruncateInput(input, threshold)
        expect(result).toEqual({
            outer: expect.stringMatching(/^\(truncated, original size \d+ KB\)$/),
        })
    })

    it('uses MB units with one decimal place for values over 1024 KB', () => {
        const large = 'x'.repeat(2 * 1024 * 1024)
        const input = { drop: large }
        const result = loggingUtils.maybeTruncateInput(input, threshold)
        expect(result).toEqual({
            drop: expect.stringMatching(/^\(truncated, original size \d+\.\d MB\)$/),
        })
    })

    it('returns the input unchanged when it is not a plain record', () => {
        expect(loggingUtils.maybeTruncateInput(undefined, threshold)).toBeUndefined()
        expect(loggingUtils.maybeTruncateInput(null, threshold)).toBeNull()
        const arr = [1, 2, 3]
        expect(loggingUtils.maybeTruncateInput(arr, threshold)).toBe(arr)
        expect(loggingUtils.maybeTruncateInput('hello', threshold)).toBe('hello')
    })

    it('does not mutate the original input record', () => {
        const large = 'x'.repeat(4096)
        const input = { keep: 'small', drop: large }
        loggingUtils.maybeTruncateInput(input, threshold)
        expect(input.drop).toBe(large)
    })
})

describe('loggingUtils.isWithinSizeLimit', () => {
    it('returns true when steps fit under the cap', () => {
        const steps = {
            step1: GenericStepOutput.create({
                type: FlowActionType.PIECE,
                status: StepOutputStatus.SUCCEEDED,
                input: { tiny: 'ok' },
            }),
        }
        expect(loggingUtils.isWithinSizeLimit(steps, 10 * 1024)).toBe(true)
    })

    it('returns false when steps blow the cap', () => {
        const steps = {
            step1: GenericStepOutput.create({
                type: FlowActionType.PIECE,
                status: StepOutputStatus.SUCCEEDED,
                input: { large: 'x'.repeat(4096) },
            }),
        }
        expect(loggingUtils.isWithinSizeLimit(steps, 128)).toBe(false)
    })
})
