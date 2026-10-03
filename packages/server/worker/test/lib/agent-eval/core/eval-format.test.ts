import { describe, expect, it } from 'vitest'
import { evalFormat } from './eval-format'

describe('evalFormat.judgeAgreement', () => {
    it('scores the judge against human labels, per side', () => {
        const agreement = evalFormat.judgeAgreement({
            verdicts: [
                { humanLabel: 'pass', judgePass: true },
                { humanLabel: 'pass', judgePass: true },
                { humanLabel: 'pass', judgePass: false },
                { humanLabel: 'fail', judgePass: true },
            ],
        })
        expect(agreement).toEqual({ n: 4, tpr: 2 / 3, tnr: 0 })
    })

    it('reports no rate for a side with no labelled cases', () => {
        expect(evalFormat.judgeAgreement({ verdicts: [{ humanLabel: 'fail', judgePass: false }] })).toEqual({ n: 1, tpr: null, tnr: 1 })
    })
})
