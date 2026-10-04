import { AIProviderName, ErrorCode } from '@activepieces/core-utils'
import { generateText, ModelMessage } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import Fastify from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { agentCompaction } from '../../../../src/app/ee/agent/agent-compaction'

vi.mock('ai', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    generateText: vi.fn().mockResolvedValue({ text: 'summary' }),
}))

const summaryModel = new MockLanguageModelV3()
const silentLog = Fastify({ logger: false }).log

function makeMessages(count: number, charsPer = 100): ModelMessage[] {
    return Array.from({ length: count }, (_, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `Message ${i}: ${'x'.repeat(charsPer)}`,
    }))
}

describe('agentCompaction.estimateTokenCount', () => {
    it('estimates tokens from message character length', () => {
        const messages = makeMessages(2, 100)
        const result = agentCompaction.estimateTokenCount({ messages, systemPromptLength: 0 })
        expect(result).toBeGreaterThan(0)
        expect(result).toBe(Math.ceil(JSON.stringify(messages).length / 4))
    })

    it('includes system prompt length in estimate', () => {
        const messages = makeMessages(1)
        const withoutSystem = agentCompaction.estimateTokenCount({ messages, systemPromptLength: 0 })
        const withSystem = agentCompaction.estimateTokenCount({ messages, systemPromptLength: 400 })
        expect(withSystem - withoutSystem).toBe(100)
    })

    it('returns 1 for empty messages with no system prompt', () => {
        const result = agentCompaction.estimateTokenCount({ messages: [], systemPromptLength: 0 })
        expect(result).toBe(Math.ceil('[]'.length / 4))
    })
})

describe('agentCompaction.shouldCompact', () => {
    it('returns false when message count is below minimum', () => {
        const result = agentCompaction.shouldCompact({
            estimatedTokens: 999_999,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: 0,
            messageCount: 5,
        })
        expect(result).toBe(false)
    })

    it('returns false when tokens are below 70% of provider limit', () => {
        // Anthropic has 200K context. 70% = 140K
        const result = agentCompaction.shouldCompact({
            estimatedTokens: 100_000,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: 0,
            messageCount: 20,
        })
        expect(result).toBe(false)
    })

    it('returns true when tokens exceed 70% of provider limit', () => {
        // Anthropic has 200K context. 70% = 140K
        const result = agentCompaction.shouldCompact({
            estimatedTokens: 150_000,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: 0,
            messageCount: 20,
        })
        expect(result).toBe(true)
    })

    it('uses correct limits per provider', () => {
        // Google has 1M context. 70% = ~700K. 150K is well below threshold.
        const result = agentCompaction.shouldCompact({
            estimatedTokens: 150_000,
            provider: AIProviderName.GOOGLE,
            reservedTokens: 0,
            messageCount: 20,
        })
        expect(result).toBe(false)
    })
})

describe('agentCompaction.buildCompactedPayload', () => {
    it('returns messages as-is when no summary exists', () => {
        const messages = makeMessages(10)
        const result = agentCompaction.buildCompactedPayload({
            messages,
            summary: null,
            summarizedUpToIndex: null,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: 0,
        })
        expect(result).toBe(messages)
    })

    it('prepends summary and keeps only recent messages', () => {
        const messages = makeMessages(10, 50)
        const result = agentCompaction.buildCompactedPayload({
            messages,
            summary: 'User discussed flow creation.',
            summarizedUpToIndex: 7,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: 0,
        })

        expect(result.length).toBe(4) // 1 summary + 3 recent (index 7,8,9)
        expect(result[0].role).toBe('user')
        expect(result[0].content).toContain('[Previous conversation summary]')
        expect(result[0].content).toContain('User discussed flow creation.')
        expect(result[1]).toBe(messages[7])
        expect(result[2]).toBe(messages[8])
        expect(result[3]).toBe(messages[9])
    })

    it('trims recent messages if compacted payload still exceeds threshold', () => {
        // Create messages with very large content so payload exceeds threshold
        // Anthropic: 200K * 0.7 = 140K tokens = 560K chars
        const largeMessages = Array.from({ length: 10 }, (_, i) => ({
            role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
            content: `Message ${i}: ${'x'.repeat(200_000)}`,
        }))

        const result = agentCompaction.buildCompactedPayload({
            messages: largeMessages,
            summary: 'Short summary.',
            summarizedUpToIndex: 5,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: 0,
        })

        // Should have trimmed some recent messages
        expect(result.length).toBeLessThan(6) // less than 1 summary + 5 recent
        expect(result[0].content).toContain('[Previous conversation summary]')
    })

    it('throws CHAT_CONTEXT_LIMIT_EXCEEDED when even minimal payload is too large', () => {
        // Single message larger than the entire context window
        const hugeMessages: ModelMessage[] = [{
            role: 'user',
            content: 'x'.repeat(2_000_000),
        }]

        expect(() => agentCompaction.buildCompactedPayload({
            messages: hugeMessages,
            summary: 'Summary',
            summarizedUpToIndex: 0,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: 0,
        })).toThrow(expect.objectContaining({
            error: expect.objectContaining({
                code: ErrorCode.CHAT_CONTEXT_LIMIT_EXCEEDED,
            }),
        }))
    })

    it('skips orphaned tool messages when trimming the recent window', () => {
        const messages: ModelMessage[] = [
            { role: 'user', content: 'msg 0' },
            { role: 'assistant', content: 'msg 1' },
            { role: 'user', content: 'msg 2' },
            { role: 'assistant', content: [{ type: 'tool-call', toolCallId: 't1', toolName: 'myTool', args: {} }] },
            { role: 'tool', content: [{ type: 'tool-result', toolCallId: 't1', result: 'done' }] },
            { role: 'assistant', content: 'msg 5' },
            { role: 'user', content: 'msg 6' },
            { role: 'assistant', content: 'msg 7' },
        ]

        // summarizedUpToIndex=4 means recent window starts at the tool message
        const result = agentCompaction.buildCompactedPayload({
            messages,
            summary: 'Summary of earlier messages.',
            summarizedUpToIndex: 4,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: 0,
        })

        // First message should be summary, second should NOT be a tool message
        expect(result[0].content).toContain('[Previous conversation summary]')
        for (let i = 1; i < result.length; i++) {
            if (i === 1) {
                expect(result[i].role).not.toBe('tool')
            }
        }
    })

    it('does not trim when compacted payload fits within threshold', () => {
        const messages = makeMessages(20, 50)
        const result = agentCompaction.buildCompactedPayload({
            messages,
            summary: 'Brief summary.',
            summarizedUpToIndex: 15,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: 0,
        })

        // 1 summary + 5 recent messages (index 15-19)
        expect(result.length).toBe(6)
    })
})

describe('agentCompaction with reserved tokens', () => {
    const RESERVED_TOKENS = 11_872 + 52_000

    it('compacts a history that fits the window only if output and tool schemas were free', () => {
        expect(agentCompaction.shouldCompact({
            estimatedTokens: 110_000,
            provider: AIProviderName.ANTHROPIC,
            messageCount: 20,
            reservedTokens: RESERVED_TOKENS,
        })).toBe(true)
    })

    it('keeps the payload plus reserved tokens inside the context window', () => {
        const messages: ModelMessage[] = Array.from({ length: 12 }, (_, i) => ({
            role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
            content: 'x'.repeat(78_000),
        }))
        const result = agentCompaction.buildCompactedPayload({
            messages,
            summary: 'summary',
            summarizedUpToIndex: 0,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: RESERVED_TOKENS,
        })
        const payloadTokens = Math.ceil(JSON.stringify(result).length / 4)
        expect(payloadTokens + RESERVED_TOKENS).toBeLessThanOrEqual(200_000)
    })

    it('sizes the recent window by tokens, so a few huge messages are summarized', async () => {
        const messages: ModelMessage[] = Array.from({ length: 12 }, (_, i) => ({
            role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
            content: 'x'.repeat(78_000),
        }))
        const result = await agentCompaction.compactMessages({
            messages,
            existingSummary: null,
            summarizedUpToIndex: null,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: RESERVED_TOKENS,
            model: summaryModel,
            log: silentLog,
        })
        expect(result.summarizedUpToIndex).toBeGreaterThanOrEqual(8)
    })

    it('bounds the summary request so oversized documents cannot overflow it', async () => {
        const messages: ModelMessage[] = Array.from({ length: 12 }, (_, i) => ({
            role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
            content: 'x'.repeat(500_000),
        }))
        await agentCompaction.compactMessages({
            messages,
            existingSummary: null,
            summarizedUpToIndex: null,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: RESERVED_TOKENS,
            model: summaryModel,
            log: silentLog,
        })
        const request = vi.mocked(generateText).mock.calls.at(-1)?.[0]
        expect(String(request?.prompt).length / 4 + 4_000).toBeLessThan(200_000)
    })

    it('counts non-Latin text as a token per character, so a long Chinese document cannot overflow the summarizer', async () => {
        const messages: ModelMessage[] = [
            { role: 'user', content: '工作流'.repeat(60_000) },
            ...Array.from({ length: 19 }, (_, i) => ({
                role: i % 2 === 0 ? 'assistant' as const : 'user' as const,
                content: i % 2 === 0 ? 'Noted.' : 'x'.repeat(29_000),
            })),
        ]
        await agentCompaction.compactMessages({
            messages,
            existingSummary: null,
            summarizedUpToIndex: null,
            provider: AIProviderName.OPENROUTER,
            reservedTokens: 66_000,
            model: summaryModel,
            log: silentLog,
        })
        const prompt = String(vi.mocked(generateText).mock.calls.at(-1)?.[0]?.prompt)
        const chineseChars = [...prompt].filter((char) => char.charCodeAt(0) >= 128).length
        const latinChars = [...prompt].length - chineseChars
        expect(chineseChars + latinChars / 4).toBeLessThan(128_000 - 4_000)
    })

    it('keeps a long document whole in the summary request when the whole request fits', async () => {
        const documentText = `START ${'d'.repeat(66_000)} THE-LAST-DETAIL`
        const messages: ModelMessage[] = [
            { role: 'user', content: documentText },
            ...Array.from({ length: 19 }, (_, i) => ({
                role: i % 2 === 0 ? 'assistant' as const : 'user' as const,
                content: i % 2 === 0 ? 'Noted.' : 'x'.repeat(29_000),
            })),
        ]
        await agentCompaction.compactMessages({
            messages,
            existingSummary: null,
            summarizedUpToIndex: null,
            provider: AIProviderName.OPENROUTER,
            reservedTokens: 66_000,
            model: summaryModel,
            log: silentLog,
        })
        const request = vi.mocked(generateText).mock.calls.at(-1)?.[0]
        expect(String(request?.prompt)).toContain('THE-LAST-DETAIL')
    })

    it('caps the summary length and bounds how long it may run', async () => {
        await agentCompaction.compactMessages({
            messages: makeMessages(40, 20_000),
            existingSummary: null,
            summarizedUpToIndex: null,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: RESERVED_TOKENS,
            model: summaryModel,
            log: silentLog,
        })
        const request = vi.mocked(generateText).mock.calls.at(-1)?.[0]
        expect(request?.maxOutputTokens).toBe(4_000)
        expect(request?.abortSignal).toBeInstanceOf(AbortSignal)
    })

    it('keeps the previous summary when the summarizer times out, so the turn still runs', async () => {
        vi.mocked(generateText).mockRejectedValueOnce(new DOMException('The operation was aborted due to timeout', 'TimeoutError'))
        const result = await agentCompaction.compactMessages({
            messages: makeMessages(40, 20_000),
            existingSummary: 'earlier summary',
            summarizedUpToIndex: 4,
            provider: AIProviderName.ANTHROPIC,
            reservedTokens: RESERVED_TOKENS,
            model: summaryModel,
            log: silentLog,
        })
        expect(result).toEqual({ summary: 'earlier summary', summarizedUpToIndex: 4 })
    })
})
