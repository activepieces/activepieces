import { describe, expect, it, vi } from 'vitest'
import { creditLedger } from '../../../../../../src/lib/execute/jobs/ee/agent/credit-ledger'

describe('creditLedger', () => {
    it('adds up the tool calls of every run but charges the message once', async () => {
        const creditsLeft = vi.fn().mockResolvedValue(10)
        const creditsLeftFor = creditLedger.create({ creditsLeft, messageCredits: 1 })

        await creditsLeftFor('main')(3)
        await creditsLeftFor('task-a')(2)
        await creditsLeftFor('task-b')(4)

        expect(creditsLeft).toHaveBeenLastCalledWith(7)
    })

    it('replaces a run\'s earlier pending total instead of adding it again', async () => {
        const creditsLeft = vi.fn().mockResolvedValue(10)
        const creditsLeftFor = creditLedger.create({ creditsLeft, messageCredits: 0 })

        await creditsLeftFor('main')(1)
        await creditsLeftFor('main')(2)

        expect(creditsLeft).toHaveBeenLastCalledWith(2)
    })
})
