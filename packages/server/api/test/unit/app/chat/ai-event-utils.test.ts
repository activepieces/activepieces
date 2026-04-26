import { describe, expect, it } from 'vitest'
import { chatEventUtils } from '../../../../src/app/chat/sandbox/ai-event-utils'

describe('chatEventUtils.extractContentText', () => {
    it('returns text when content is an object with type "text" and a string text field', () => {
        const update = { content: { type: 'text', text: 'Hello, world!' } }
        expect(chatEventUtils.extractContentText(update)).toBe('Hello, world!')
    })

    it('returns undefined when content is missing', () => {
        const update: Record<string, unknown> = {}
        expect(chatEventUtils.extractContentText(update)).toBeUndefined()
    })

    it('returns undefined when content is not an object (is a string)', () => {
        const update = { content: 'some string' }
        expect(chatEventUtils.extractContentText(update)).toBeUndefined()
    })

    it('returns undefined when content is null', () => {
        const update = { content: null }
        expect(chatEventUtils.extractContentText(update)).toBeUndefined()
    })

    it('returns undefined when content type is not "text"', () => {
        const update = { content: { type: 'image', text: 'ignored' } }
        expect(chatEventUtils.extractContentText(update)).toBeUndefined()
    })

    it('returns undefined when content type is missing', () => {
        const update = { content: { text: 'Hello' } }
        expect(chatEventUtils.extractContentText(update)).toBeUndefined()
    })

    it('returns undefined when content.text is not a string (is a number)', () => {
        const update = { content: { type: 'text', text: 42 } }
        expect(chatEventUtils.extractContentText(update)).toBeUndefined()
    })

    it('returns undefined when content.text is not a string (is an object)', () => {
        const update = { content: { type: 'text', text: { nested: true } } }
        expect(chatEventUtils.extractContentText(update)).toBeUndefined()
    })

    it('returns empty string when content.text is an empty string', () => {
        const update = { content: { type: 'text', text: '' } }
        expect(chatEventUtils.extractContentText(update)).toBe('')
    })
})

describe('chatEventUtils.isHistoryReplayContent', () => {
    it('returns true for text containing both "jsonrpc" and "session/update" markers', () => {
        const text = 'some preamble {"jsonrpc":"2.0","method":"session/update"} more text'
        expect(chatEventUtils.isHistoryReplayContent(text)).toBe(true)
    })

    it('returns false when only "jsonrpc" is present without "session/update"', () => {
        const text = '{"jsonrpc":"2.0","method":"other/method"}'
        expect(chatEventUtils.isHistoryReplayContent(text)).toBe(false)
    })

    it('returns false when only "session/update" is present without "jsonrpc"', () => {
        const text = 'calling session/update endpoint'
        expect(chatEventUtils.isHistoryReplayContent(text)).toBe(false)
    })

    it('returns true for text containing "Previous session history is replayed below"', () => {
        const text = 'Previous session history is replayed below\nsome old message'
        expect(chatEventUtils.isHistoryReplayContent(text)).toBe(true)
    })

    it('returns true for text containing "[history truncated]"', () => {
        const text = 'lots of history ... [history truncated]'
        expect(chatEventUtils.isHistoryReplayContent(text)).toBe(true)
    })

    it('returns true for text containing all three of "createdAt", "sender", and "payload"', () => {
        const text = '{"createdAt":"2024-01-01","sender":"agent","payload":{}}'
        expect(chatEventUtils.isHistoryReplayContent(text)).toBe(true)
    })

    it('returns false when only "createdAt" and "sender" are present without "payload"', () => {
        const text = '{"createdAt":"2024-01-01","sender":"agent"}'
        expect(chatEventUtils.isHistoryReplayContent(text)).toBe(false)
    })

    it('returns false when only "createdAt" and "payload" are present without "sender"', () => {
        const text = '{"createdAt":"2024-01-01","payload":{}}'
        expect(chatEventUtils.isHistoryReplayContent(text)).toBe(false)
    })

    it('returns false for normal user text with no markers', () => {
        const text = 'Hello! Can you help me with my workflow?'
        expect(chatEventUtils.isHistoryReplayContent(text)).toBe(false)
    })

    it('returns false for an empty string', () => {
        expect(chatEventUtils.isHistoryReplayContent('')).toBe(false)
    })

    it('returns false for text that partially resembles markers', () => {
        const text = 'previous session'
        expect(chatEventUtils.isHistoryReplayContent(text)).toBe(false)
    })
})

describe('chatEventUtils.extractToolOutput', () => {
    it('returns rawOutput string when it exists', () => {
        const update = { rawOutput: 'tool result here' }
        expect(chatEventUtils.extractToolOutput(update)).toBe('tool result here')
    })

    it('prefers rawOutput over content array', () => {
        const update = {
            rawOutput: 'from raw',
            content: [{ type: 'text', text: 'from content' }],
        }
        expect(chatEventUtils.extractToolOutput(update)).toBe('from raw')
    })

    it('returns concatenated text blocks from content array when rawOutput is absent', () => {
        const update = {
            content: [
                { type: 'text', text: 'First block' },
                { type: 'text', text: 'Second block' },
            ],
        }
        expect(chatEventUtils.extractToolOutput(update)).toBe('First block\nSecond block')
    })

    it('skips non-text blocks in content array', () => {
        const update = {
            content: [
                { type: 'image', data: 'base64data' },
                { type: 'text', text: 'Only text' },
            ],
        }
        expect(chatEventUtils.extractToolOutput(update)).toBe('Only text')
    })

    it('skips content blocks with non-string text', () => {
        const update = {
            content: [
                { type: 'text', text: 42 },
                { type: 'text', text: 'Valid text' },
            ],
        }
        expect(chatEventUtils.extractToolOutput(update)).toBe('Valid text')
    })

    it('returns undefined when rawOutput is not a string (is a number)', () => {
        const update = { rawOutput: 123, content: [] as unknown[] }
        expect(chatEventUtils.extractToolOutput(update)).toBeUndefined()
    })

    it('returns undefined when content array is empty', () => {
        const update = { content: [] as unknown[] }
        expect(chatEventUtils.extractToolOutput(update)).toBeUndefined()
    })

    it('returns undefined when neither rawOutput nor content exists', () => {
        const update: Record<string, unknown> = {}
        expect(chatEventUtils.extractToolOutput(update)).toBeUndefined()
    })

    it('returns undefined when content is not an array (is a string)', () => {
        const update = { content: 'not an array' }
        expect(chatEventUtils.extractToolOutput(update)).toBeUndefined()
    })

    it('handles a single text block in the content array', () => {
        const update = {
            content: [{ type: 'text', text: 'single result' }],
        }
        expect(chatEventUtils.extractToolOutput(update)).toBe('single result')
    })
})
