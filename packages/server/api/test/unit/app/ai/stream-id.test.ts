import { describe, expect, it } from 'vitest'
import { streamId } from '../../../../src/app/ai/usage/stream-id'

describe('streamId', () => {
    it('increments the sequence, and rolls over to the next millisecond at the maximum', () => {
        expect(streamId.format(streamId.increment(streamId.parse('1700000000000-5')))).toBe('1700000000000-6')
        expect(streamId.format(streamId.increment(streamId.parse('1700000000000-18446744073709551615')))).toBe('1700000000001-0')
    })

    it('compares as numbers, so -10 comes after -9', () => {
        expect(streamId.compare(streamId.parse('5-10'), streamId.parse('5-9'))).toBe(1)
        expect(streamId.compare(streamId.parse('4-99'), streamId.parse('5-0'))).toBe(-1)
        expect(streamId.compare(streamId.parse('5-3'), streamId.parse('5-3'))).toBe(0)
    })
})
