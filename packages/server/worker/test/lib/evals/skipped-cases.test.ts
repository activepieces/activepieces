import { describe, expect, it } from 'vitest'
import { EvalCase } from './eval-case'
import { skippedCases } from './skipped-cases'

describe('skippedCases', () => {
    it('keeps skipped cases with their reason instead of dropping them', async () => {
        const dataset = { name: 'chat-core', cases: [caseOf(1), caseOf(2)] }

        const split = await skippedCases.split({ dataset, projectName: 'Main', unmetOf: async (candidate) => candidate.caseNumber === 2 ? ['needs connection "Work Gmail" (@activepieces/piece-gmail)'] : [] })

        expect(split.cases.map((candidate) => candidate.caseNumber)).toEqual([1])
        expect(split.skipped).toEqual([{ candidate: dataset.cases[1], reason: 'needs connection "Work Gmail" (@activepieces/piece-gmail) in project "Main"' }])
    })

    it('turns an ok or unchecked outcome into unchecked when a case was skipped, and keeps broken', () => {
        const skipped = [{ candidate: caseOf(2), reason: 'needs connection' }]

        expect(skippedCases.withSkipped({ outcome: { status: 'ok', reason: '' }, name: 'chat-core', skipped })).toEqual({ status: 'unchecked', reason: '1 chat-core case(s) were skipped for a missing connection' })
        expect(skippedCases.withSkipped({ outcome: { status: 'unchecked', reason: 'no main baseline' }, name: 'chat-core', skipped })).toEqual({ status: 'unchecked', reason: 'no main baseline; 1 chat-core case(s) were skipped for a missing connection' })
        expect(skippedCases.withSkipped({ outcome: { status: 'broken', reason: '1 regressed' }, name: 'chat-core', skipped })).toEqual({ status: 'broken', reason: '1 regressed' })
        expect(skippedCases.withSkipped({ outcome: { status: 'ok', reason: '' }, name: 'chat-core', skipped: [] })).toEqual({ status: 'ok', reason: '' })
    })
})

function caseOf(caseNumber: number): EvalCase {
    return { id: `c${caseNumber}`, versionId: 'v1', caseNumber, title: `case ${caseNumber}`, problemType: 'core', checks: ['c'], cutBeforeStep: undefined, targetTool: undefined, preloadedSkills: [], userMessage: 'u', messages: [], steps: [], recordedToolCalls: [], live: null }
}
