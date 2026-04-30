import { AIProviderName, ErrorCode } from '@activepieces/shared'
import { ModelMessage } from 'ai'
import { describe, expect, it } from 'vitest'
import { chatCompaction } from '../../../../src/app/chat/chat-compaction'

function makeMessages(count: number, charsPer = 100): ModelMessage[] {
    return Array.from({ length: count }, (_, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `Message ${i}: ${'x'.repeat(charsPer)}`,
    }))
}

describe('chatCompaction.estimateTokenCount', () => {
    it('estimates tokens from message character length', () => {
        const messages = makeMessages(2, 100)
        const result = chatCompaction.estimateTokenCount({ messages, systemPromptLength: 0 })
        expect(result).toBeGreaterThan(0)
        expect(result).toBe(Math.ceil(JSON.stringify(messages).length / 4))
    })

    it('includes system prompt length in estimate', () => {
        const messages = makeMessages(1)
        const withoutSystem = chatCompaction.estimateTokenCount({ messages, systemPromptLength: 0 })
        const withSystem = chatCompaction.estimateTokenCount({ messages, systemPromptLength: 400 })
        expect(withSystem - withoutSystem).toBe(100)
    })

    it('returns 1 for empty messages with no system prompt', () => {
        const result = chatCompaction.estimateTokenCount({ messages: [], systemPromptLength: 0 })
        expect(result).toBe(Math.ceil('[]'.length / 4))
    })
})

describe('chatCompaction.shouldCompact', () => {
    it('returns false when message count is below minimum', () => {
        const result = chatCompaction.shouldCompact({
            estimatedTokens: 999_999,
            provider: AIProviderName.ANTHROPIC,
            messageCount: 5,
        })
        expect(result).toBe(false)
    })

    it('returns false when tokens are below 70% of provider limit', () => {
        // Anthropic has 200K context. 70% = 140K
        const result = chatCompaction.shouldCompact({
            estimatedTokens: 100_000,
            provider: AIProviderName.ANTHROPIC,
            messageCount: 20,
        })
        expect(result).toBe(false)
    })

    it('returns true when tokens exceed 70% of provider limit', () => {
        // Anthropic has 200K context. 70% = 140K
        const result = chatCompaction.shouldCompact({
            estimatedTokens: 150_000,
            provider: AIProviderName.ANTHROPIC,
            messageCount: 20,
        })
        expect(result).toBe(true)
    })

    it('uses correct limits per provider', () => {
        // OpenAI has 1M context. 70% = 700K
        const result = chatCompaction.shouldCompact({
            estimatedTokens: 150_000,
            provider: AIProviderName.OPENAI,
            messageCount: 20,
        })
        expect(result).toBe(false)
    })
})

describe('chatCompaction.buildCompactedPayload', () => {
    it('returns messages as-is when no summary exists', () => {
        const messages = makeMessages(10)
        const result = chatCompaction.buildCompactedPayload({
            messages,
            summary: null,
            summarizedUpToIndex: null,
            provider: AIProviderName.ANTHROPIC,
        })
        expect(result).toBe(messages)
    })

    it('prepends summary and keeps only recent messages', () => {
        const messages = makeMessages(10, 50)
        const result = chatCompaction.buildCompactedPayload({
            messages,
            summary: 'User discussed flow creation.',
            summarizedUpToIndex: 7,
            provider: AIProviderName.ANTHROPIC,
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

        const result = chatCompaction.buildCompactedPayload({
            messages: largeMessages,
            summary: 'Short summary.',
            summarizedUpToIndex: 5,
            provider: AIProviderName.ANTHROPIC,
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

        expect(() => chatCompaction.buildCompactedPayload({
            messages: hugeMessages,
            summary: 'Summary',
            summarizedUpToIndex: 0,
            provider: AIProviderName.ANTHROPIC,
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
        const result = chatCompaction.buildCompactedPayload({
            messages,
            summary: 'Summary of earlier messages.',
            summarizedUpToIndex: 4,
            provider: AIProviderName.ANTHROPIC,
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
        const result = chatCompaction.buildCompactedPayload({
            messages,
            summary: 'Brief summary.',
            summarizedUpToIndex: 15,
            provider: AIProviderName.ANTHROPIC,
        })

        // 1 summary + 5 recent messages (index 15-19)
        expect(result.length).toBe(6)
    })
})
