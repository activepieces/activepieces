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
