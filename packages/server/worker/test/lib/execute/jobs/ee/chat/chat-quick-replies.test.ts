import { PersistedChatPart, PersistedChatPartType, PersistedToolCallStatus } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { chatQuickReplies } from '../../../../../../src/lib/execute/jobs/ee/chat/chat-quick-replies'
import { ChatTurnToolCall } from '../../../../../../src/lib/execute/jobs/ee/chat/run-chat-turn'

function toolCall(toolName: string): ChatTurnToolCall {
    return { toolName, toolCallId: 'c', input: {}, order: 0, phase: 'discovery' }
}

function toolCallPart({ toolName, input }: { toolName: string, input: Record<string, unknown> }): PersistedChatPart {
    return {
        type: PersistedChatPartType.TOOL_CALL,
        toolCallId: 'p',
        toolName,
        input,
        output: {},
        status: PersistedToolCallStatus.COMPLETED,
    }
}

function textPart(text: string): PersistedChatPart {
    return { type: PersistedChatPartType.TEXT, text }
}

describe('chatQuickReplies.shouldGenerateSuggestions', () => {
    const base = { toolCalls: [toolCall('ap_execute_action')], chatMode: 'DEFAULT', dryRun: false, discoveryOnly: false, aborted: false }

    it('generates on a normal turn', () => {
        expect(chatQuickReplies.shouldGenerateSuggestions(base)).toBe(true)
    })

    it('skips dry-run, discovery-only, aborted, and referral turns', () => {
        expect(chatQuickReplies.shouldGenerateSuggestions({ ...base, dryRun: true })).toBe(false)
        expect(chatQuickReplies.shouldGenerateSuggestions({ ...base, discoveryOnly: true })).toBe(false)
        expect(chatQuickReplies.shouldGenerateSuggestions({ ...base, aborted: true })).toBe(false)
        expect(chatQuickReplies.shouldGenerateSuggestions({ ...base, chatMode: 'REFERRAL' })).toBe(false)
    })

    it('skips when a card already owns the next step', () => {
        for (const card of ['ap_show_questions', 'ap_show_connection_picker', 'ap_show_showcase']) {
            expect(chatQuickReplies.shouldGenerateSuggestions({ ...base, toolCalls: [toolCall(card)] })).toBe(false)
        }
    })
})

describe('chatQuickReplies.builtAutomationThisTurn', () => {
    it('is true when a flow-construction tool ran', () => {
        expect(chatQuickReplies.builtAutomationThisTurn([toolCall('ap_set_build_plan')])).toBe(true)
        expect(chatQuickReplies.builtAutomationThisTurn([toolCall('ap_build_flow')])).toBe(true)
    })

    it('is false for read/execute-only turns', () => {
        expect(chatQuickReplies.builtAutomationThisTurn([toolCall('ap_execute_action'), toolCall('ap_find_records')])).toBe(false)
    })
})

describe('chatQuickReplies.extractInlineReplies', () => {
    it('returns replies from an inline ap_show_quick_replies part', () => {
        const parts = [textPart('hi'), toolCallPart({ toolName: 'ap_show_quick_replies', input: { replies: ['A', 'B'] } })]
        expect(chatQuickReplies.extractInlineReplies(parts)).toEqual(['A', 'B'])
    })

    it('returns an empty array when the model offered no chips', () => {
        expect(chatQuickReplies.extractInlineReplies([textPart('hi')])).toEqual([])
    })
})

describe('chatQuickReplies.summarizeTurnForSuggestions', () => {
    it('includes the user message, the assistant reply, and action done-titles', () => {
        const parts = [
            textPart('Here is your report.'),
            toolCallPart({ toolName: 'ap_execute_action', input: { doneTitle: 'Pulled the Stripe payments' } }),
        ]
        const summary = chatQuickReplies.summarizeTurnForSuggestions({ uiParts: parts, userMessage: 'Summarize my revenue' })
        expect(summary).toContain('Summarize my revenue')
        expect(summary).toContain('Pulled the Stripe payments')
        expect(summary).toContain('Here is your report.')
    })

    it('excludes display and plumbing tools from the actions list', () => {
        const parts = [
            toolCallPart({ toolName: 'ap_update_thinking_status', input: { status: 'thinking' } }),
            toolCallPart({ toolName: 'ap_show_quick_replies', input: { replies: ['x'] } }),
        ]
        const summary = chatQuickReplies.summarizeTurnForSuggestions({ uiParts: parts, userMessage: 'hi' })
        expect(summary).toContain('(no tools — a direct reply)')
        expect(summary).not.toContain('ap_update_thinking_status')
        expect(summary).not.toContain('ap_show_quick_replies')
    })
})
