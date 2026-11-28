import { describe, expect, it } from 'vitest'
import { shutdownBudget } from '../../src/lib/config/shutdown-budget'

describe('shutdownBudget', () => {
    it('force-exits at the flow timeout plus 105 s, the sum the Helm chart uses for terminationGracePeriodSeconds', () => {
        expect(shutdownBudget.forceExitMs({ flowTimeoutMs: 600_000 })).toBe(705_000)
        expect(shutdownBudget.forceExitMs({ flowTimeoutMs: 1_800_000 })).toBe(1_905_000)
    })
})
