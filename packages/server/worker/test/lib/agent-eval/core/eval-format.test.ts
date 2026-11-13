import { describe, expect, it } from 'vitest'
import { evalFormat } from './eval-format'

describe('evalFormat.judgeAgreement', () => {
    it('scores the judge on human labels only, and reports model-written drafts separately', () => {
        const agreement = evalFormat.judgeAgreement({
            verdicts: [
                { humanLabel: 'pass', judgePass: true, draft: false },
                { humanLabel: 'pass', judgePass: false, draft: false },
                { humanLabel: 'fail', judgePass: true, draft: false },
                { humanLabel: 'pass', judgePass: true, draft: true },
                { humanLabel: 'fail', judgePass: false, draft: true },
            ],
        })
        expect(agreement).toEqual({ n: 3, tpr: 0.5, tnr: 0, draft: { n: 2, tpr: 1, tnr: 1 } })
    })

    it('has no human rate when every label is a draft', () => {
        expect(evalFormat.judgeAgreement({ verdicts: [{ humanLabel: 'fail', judgePass: false, draft: true }] })).toEqual({ n: 0, tpr: null, tnr: null, draft: { n: 1, tpr: null, tnr: 1 } })
    })
})

describe('evalFormat cost helpers', () => {
    it('sums costs, but is unknown when any part is unknown', () => {
        expect(evalFormat.sumCost({ costs: [0.1, 0.2] })).toBeCloseTo(0.3)
        expect(evalFormat.sumCost({ costs: [0.1, null] })).toBeNull()
    })

    it('formats dollars with precision for small amounts', () => {
        expect(evalFormat.formatUsd(0.01234)).toBe('$0.0123')
        expect(evalFormat.formatUsd(12.5)).toBe('$12.50')
        expect(evalFormat.formatUsd(null)).toBe('—')
    })

    it('shows the candidate cost change as a signed percentage', () => {
        expect(evalFormat.costDelta({ baseline: 0.4, candidate: 0.1 })).toBe('−75%')
        expect(evalFormat.costDelta({ baseline: 0.1, candidate: 0.15 })).toBe('+50%')
        expect(evalFormat.costDelta({ baseline: 0, candidate: 0.1 })).toBeNull()
        expect(evalFormat.costDelta({ baseline: null, candidate: 0.1 })).toBeNull()
    })
})
