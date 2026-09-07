import { describe, expect, it } from 'vitest'
import { largeResultUtils, MAX_TOOL_RESULT_BYTES } from '../src/large-result-utils'

function gmailSearchOutput(messageCount: number) {
    return {
        found: true,
        results: {
            count: messageCount,
            messages: Array.from({ length: messageCount }, (_, index) => ({
                id: `msg-${index}`,
                subject: `Subject number ${index}`,
                from: { text: `sender-${index}@example.com` },
                date: '2026-08-17T15:49:40.000Z',
                headerLines: Array.from({ length: 40 }, (_, line) => ({
                    key: `header-${line}`,
                    line: `ARC-Seal: ${'b'.repeat(1_200)}`,
                })),
                html: `<html>${'h'.repeat(200_000)}</html>`,
                text: 't'.repeat(120_000),
                textAsHtml: 'a'.repeat(120_000),
            })),
        },
    }
}

describe('largeResultUtils.fitToBudget', () => {
    const wrapAsToolResult = (json: string) => JSON.stringify({ content: [{ type: 'text', text: `✅ Find Email completed.\n\n${json}` }] })

    it('keeps every record of a Gmail search, subjects and senders intact', () => {
        const fitted = largeResultUtils.fitToBudget({
            value: gmailSearchOutput(5),
            maxBytes: MAX_TOOL_RESULT_BYTES,
            wrap: wrapAsToolResult,
        })

        expect(fitted).not.toBeNull()
        for (let index = 0; index < 5; index++) {
            expect(fitted).toContain(`Subject number ${index}`)
            expect(fitted).toContain(`sender-${index}@example.com`)
        }
    })

    it('measures the wrapped form, so escaping cannot push the result over budget', () => {
        const quoteHeavy = { rows: Array.from({ length: 400 }, (_, index) => ({ note: `"${'q'.repeat(900)}" ${index}` })) }
        const fitted = largeResultUtils.fitToBudget({
            value: quoteHeavy,
            maxBytes: MAX_TOOL_RESULT_BYTES,
            wrap: wrapAsToolResult,
        })

        expect(fitted).not.toBeNull()
        expect(Buffer.byteLength(fitted as string, 'utf8')).toBeLessThanOrEqual(MAX_TOOL_RESULT_BYTES)
    })

    it('returns null when no rung fits, rather than a mangled prefix', () => {
        const wide = Object.fromEntries(Array.from({ length: 200_000 }, (_, index) => [`key-${index}`, index]))
        expect(largeResultUtils.fitToBudget({ value: wide, maxBytes: MAX_TOOL_RESULT_BYTES, wrap: wrapAsToolResult })).toBeNull()
    })

    it('shows a circular payload with the loop marked instead of refusing it', () => {
        const circular: Record<string, unknown> = { id: 'row-1', blob: 'c'.repeat(400_000) }
        circular['self'] = circular
        const fitted = largeResultUtils.fitToBudget({ value: circular, maxBytes: MAX_TOOL_RESULT_BYTES, wrap: wrapAsToolResult })

        expect(fitted).toContain('row-1')
        expect(fitted).toContain('[circular]')
    })
})

describe('largeResultUtils.shrinkValue', () => {
    it('marks how much of a string was cut', () => {
        const shrunk = largeResultUtils.shrinkValue({
            value: { short: 'hi', long: 'a'.repeat(5_000) },
            limits: { maxStringLength: 2_000, maxArrayItems: 20 },
        }) as Record<string, string>

        expect(shrunk.short).toBe('hi')
        expect(shrunk.long).toContain('…[truncated 3000 chars]')
    })

    it('says how many array items it left out', () => {
        const shrunk = largeResultUtils.shrinkValue({
            value: Array.from({ length: 50 }, (_, index) => index),
            limits: { maxStringLength: 2_000, maxArrayItems: 20 },
        }) as unknown[]

        expect(shrunk).toHaveLength(21)
        expect(shrunk[20]).toBe('…and 30 more items')
    })

    it('leaves a value that is already within the limits untouched', () => {
        const value = { a: { b: { c: 'value' } }, list: [1, 2] }
        expect(largeResultUtils.shrinkValue({ value, limits: { maxStringLength: 2_000, maxArrayItems: 20 } })).toEqual(value)
    })
})
