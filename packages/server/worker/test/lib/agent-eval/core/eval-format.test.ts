import { describe, expect, it } from 'vitest'
import { evalFormat } from './eval-format'

describe('evalFormat.judgeAgreement', () => {
    it('scores the judge against labels per side, and counts model-written drafts', () => {
        const agreement = evalFormat.judgeAgreement({
            verdicts: [
                { humanLabel: 'pass', judgePass: true, draft: true },
                { humanLabel: 'pass', judgePass: true, draft: false },
                { humanLabel: 'pass', judgePass: false, draft: true },
                { humanLabel: 'fail', judgePass: true, draft: false },
            ],
        })
        expect(agreement).toEqual({ n: 4, drafts: 2, tpr: 2 / 3, tnr: 0 })
    })

    it('reports no rate for a side with no labelled cases', () => {
        expect(evalFormat.judgeAgreement({ verdicts: [{ humanLabel: 'fail', judgePass: false, draft: false }] })).toEqual({ n: 1, drafts: 0, tpr: null, tnr: 1 })
    })
})
