import { describe, expect, it } from 'vitest'
import { pieceUpgradeRegister } from '../../../../../src/app/flows/flow-version/piece-upgrade-register'

describe('pieceUpgradeRegister.resolveDecision', () => {
    it('upgrades when the version has no unsafe steps', () => {
        const decision = pieceUpgradeRegister.resolveDecision({ entry: { target: '0.9.9' }, usedStepName: 'send_email' })
        expect(decision).toEqual({ outcome: 'upgraded', toVersion: '0.9.9' })
    })

    it('upgrades a clean step even when other steps of the version are unsafe', () => {
        const decision = pieceUpgradeRegister.resolveDecision({ entry: { target: '0.9.9', unsafeSteps: ['delete_row'] }, usedStepName: 'send_email' })
        expect(decision).toEqual({ outcome: 'upgraded', toVersion: '0.9.9' })
    })

    it('keeps a step listed as unsafe', () => {
        const decision = pieceUpgradeRegister.resolveDecision({ entry: { target: '0.9.9', unsafeSteps: ['delete_row'] }, usedStepName: 'delete_row' })
        expect(decision).toEqual({ outcome: 'kept' })
    })
})
