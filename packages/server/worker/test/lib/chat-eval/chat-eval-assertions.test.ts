import { chatToolPhases } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { chatEvalAssertions as A } from './chat-eval-assertions'
import { CHAT_EVAL_SCENARIOS } from './chat-eval-scenarios'
import { ToolCallRecord, Transcript } from './chat-eval-types'

function transcript({ toolCalls = [], texts = [], turns = 1 }: {
    toolCalls?: ToolCallRecord[]
    texts?: string[]
    turns?: number
}): Transcript {
    return {
        toolCalls,
        assistantTexts: texts.map((text, i) => ({ turn: i, text })),
        turns,
    }
}

function call(toolName: string, turn = 0, input: Record<string, unknown> = {}): ToolCallRecord {
    return { turn, toolName, input }
}

describe('chat eval assertions', () => {
    it('neverAskedForColumns fails when the agent asks about columns', () => {
        const bad = transcript({ texts: ['Could you share the column names for each candidate?'] })
        const good = transcript({ texts: ['What makes a candidate strong for this role?'] })
        expect(A.neverAskedForColumns(bad).passed).toBe(false)
        expect(A.neverAskedForColumns(good).passed).toBe(true)
    })

    it('neverAskedHow flags technical "how to build" questions', () => {
        const bad = transcript({ texts: ['Which trigger should we use for this?'] })
        const good = transcript({ texts: ['Where should the results go when it is done?'] })
        expect(A.neverAskedHow(bad).passed).toBe(false)
        expect(A.neverAskedHow(good).passed).toBe(true)
    })

    it('neverClaimedCutOff catches the cut-off hallucination', () => {
        const bad = transcript({ texts: ['It looks like your message got cut off!'] })
        expect(A.neverClaimedCutOff(bad).passed).toBe(false)
        expect(A.neverClaimedCutOff(transcript({ texts: ['Got it.'] })).passed).toBe(true)
    })

    it('calledBefore enforces ordering', () => {
        const t = transcript({ toolCalls: [call('ap_resolve_property_options', 0), call('ap_explore_data', 1)] })
        expect(A.calledBefore('ap_resolve_property_options', 'ap_explore_data')(t).passed).toBe(true)
        expect(A.calledBefore('ap_explore_data', 'ap_resolve_property_options')(t).passed).toBe(false)
    })

    it('noBuildToolBeforePhaseSet flags premature building', () => {
        const premature = transcript({ toolCalls: [call('ap_research_pieces', 0), call('ap_build_flow', 1)] })
        const correct = transcript({ toolCalls: [call('ap_research_pieces', 0), call('ap_set_phase', 1, { phase: 'build' }), call('ap_build_flow', 1)] })
        expect(A.noBuildToolBeforePhaseSet(chatToolPhases.isBuildOnlyTool)(premature).passed).toBe(false)
        expect(A.noBuildToolBeforePhaseSet(chatToolPhases.isBuildOnlyTool)(correct).passed).toBe(true)
    })

    it('reachedToolWithin checks the turn budget', () => {
        const t = transcript({ toolCalls: [call('ap_show_setup_form', 0)] })
        expect(A.reachedToolWithin('ap_show_setup_form', 0)(t).passed).toBe(true)
        expect(A.reachedToolWithin('ap_show_setup_form', 0)(transcript({})).passed).toBe(false)
    })

    it('maxQuestionCards bounds the card count', () => {
        const t = transcript({ toolCalls: [call('ap_show_questions'), call('ap_show_questions')] })
        expect(A.maxQuestionCards(0)(t).passed).toBe(false)
        expect(A.maxQuestionCards(2)(t).passed).toBe(true)
    })
})

describe('chat eval scenarios', () => {
    it('every seed scenario is well-formed', () => {
        expect(CHAT_EVAL_SCENARIOS.length).toBeGreaterThanOrEqual(5)
        for (const s of CHAT_EVAL_SCENARIOS) {
            expect(s.id).toBeTruthy()
            expect(s.userMessages.length).toBeGreaterThan(0)
            expect(s.assertions.length).toBeGreaterThan(0)
        }
    })

    it('a clean discovery transcript passes the enumerate-then-read scenario', () => {
        const clean = transcript({
            toolCalls: [call('ap_resolve_property_options', 0), call('ap_explore_data', 0)],
            texts: ['What makes a candidate strong for this senior backend role?'],
        })
        const scenario = CHAT_EVAL_SCENARIOS.find((s) => s.id === 'discovery-enumerate-then-read')!
        const results = scenario.assertions.map((a) => a(clean))
        expect(results.every((r) => r.passed)).toBe(true)
    })
})
