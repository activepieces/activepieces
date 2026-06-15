import { PersistedChatPart, PersistedChatPartType } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { transcriptAssertions } from './transcript-assertions'
import { ChatTurnResult, ChatTurnToolCall } from '../../../src/lib/execute/jobs/ee/chat/run-chat-turn'

function textPart(text: string): PersistedChatPart {
    return { type: PersistedChatPartType.TEXT, text }
}

function toolCall({ toolName, order, phase = 'discovery' }: { toolName: string, order: number, phase?: 'discovery' | 'build' }): ChatTurnToolCall {
    return { toolName, toolCallId: `id-${order}`, input: {}, order, phase }
}

function makeResult(overrides: Partial<ChatTurnResult> = {}): ChatTurnResult {
    return {
        accumulatedResponseMessages: [],
        abortedStepMessages: [],
        uiParts: [],
        usage: undefined,
        finishReason: 'stop',
        truncatedAfterRetries: false,
        aborted: false,
        streamError: null,
        continuations: 0,
        emptyContinuations: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        toolCalls: [],
        ...overrides,
    }
}

describe('transcriptAssertions.neverAskedHow', () => {
    it('fails when the assistant asks a how/technical question', () => {
        const result = makeResult({ uiParts: [textPart('Sure! How would you like to map the columns?')] })
        expect(transcriptAssertions.neverAskedHow(result).pass).toBe(false)
    })

    it('passes when the assistant speaks in business terms', () => {
        const result = makeResult({ uiParts: [textPart('Got it — I will set up a flow that emails you when a new lead arrives.')] })
        expect(transcriptAssertions.neverAskedHow(result).pass).toBe(true)
    })
})

describe('transcriptAssertions.neverCutOff', () => {
    it('fails when truncated after retries', () => {
        expect(transcriptAssertions.neverCutOff(makeResult({ truncatedAfterRetries: true })).pass).toBe(false)
    })

    it('fails when finishReason is length', () => {
        expect(transcriptAssertions.neverCutOff(makeResult({ finishReason: 'length' })).pass).toBe(false)
    })

    it('passes on a clean stop', () => {
        expect(transcriptAssertions.neverCutOff(makeResult({ finishReason: 'stop' })).pass).toBe(true)
    })
})

describe('transcriptAssertions.noBuildToolBeforePhaseSet', () => {
    it('fails when a build-only tool runs while still in discovery', () => {
        const result = makeResult({ toolCalls: [toolCall({ toolName: 'ap_build_flow', order: 0, phase: 'discovery' })] })
        expect(transcriptAssertions.noBuildToolBeforePhaseSet(result).pass).toBe(false)
    })

    it('passes when build-only tools run in the build phase', () => {
        const result = makeResult({ toolCalls: [
            toolCall({ toolName: 'ap_explore_data', order: 0, phase: 'discovery' }),
            toolCall({ toolName: 'ap_build_flow', order: 1, phase: 'build' }),
        ] })
        expect(transcriptAssertions.noBuildToolBeforePhaseSet(result).pass).toBe(true)
    })
})

describe('transcriptAssertions.calledBefore', () => {
    const result = makeResult({ toolCalls: [
        toolCall({ toolName: 'ap_research_pieces', order: 0 }),
        toolCall({ toolName: 'ap_build_flow', order: 1, phase: 'build' }),
    ] })

    it('passes when a precedes b', () => {
        expect(transcriptAssertions.calledBefore(result, 'ap_research_pieces', 'ap_build_flow').pass).toBe(true)
    })

    it('fails when a follows b', () => {
        expect(transcriptAssertions.calledBefore(result, 'ap_build_flow', 'ap_research_pieces').pass).toBe(false)
    })

    it('fails when a never ran', () => {
        expect(transcriptAssertions.calledBefore(result, 'ap_test_flow', 'ap_build_flow').pass).toBe(false)
    })

    it('fails when b never ran (no vacuous pass)', () => {
        expect(transcriptAssertions.calledBefore(result, 'ap_research_pieces', 'ap_test_flow').pass).toBe(false)
    })
})

describe('transcriptAssertions.reachedToolWithin', () => {
    const result = makeResult({ toolCalls: [
        toolCall({ toolName: 'ap_research_pieces', order: 0 }),
        toolCall({ toolName: 'ap_build_flow', order: 3, phase: 'build' }),
    ] })

    it('passes when the tool is reached within n', () => {
        expect(transcriptAssertions.reachedToolWithin(result, 'ap_build_flow', 3).pass).toBe(true)
    })

    it('fails when the tool is reached too late', () => {
        expect(transcriptAssertions.reachedToolWithin(result, 'ap_build_flow', 2).pass).toBe(false)
    })

    it('fails when the tool never ran', () => {
        expect(transcriptAssertions.reachedToolWithin(result, 'ap_test_flow', 5).pass).toBe(false)
    })
})

describe('transcriptAssertions.maxQuestionCards', () => {
    const result = makeResult({ toolCalls: [
        toolCall({ toolName: 'ap_show_questions', order: 0 }),
        toolCall({ toolName: 'ap_show_quick_replies', order: 1 }),
    ] })

    it('passes within the limit', () => {
        expect(transcriptAssertions.maxQuestionCards(result, 2).pass).toBe(true)
    })

    it('fails over the limit', () => {
        expect(transcriptAssertions.maxQuestionCards(result, 1).pass).toBe(false)
    })

    it('honors an explicit tool-name list', () => {
        expect(transcriptAssertions.maxQuestionCards(result, 0, ['ap_show_questions']).pass).toBe(false)
        expect(transcriptAssertions.maxQuestionCards(result, 1, ['ap_show_questions']).pass).toBe(true)
    })
})
