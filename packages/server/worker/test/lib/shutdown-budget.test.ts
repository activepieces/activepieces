import { describe, expect, it } from 'vitest'
import { shutdownBudget } from '../../src/lib/config/shutdown-budget'

const DEFAULT_FLOW_TIMEOUT_MS = 600_000

describe('shutdownBudget', () => {
    describe('drainMs', () => {
        it('waits one flow timeout plus 90 s', () => {
            expect(shutdownBudget.drainMs({ flowTimeoutMs: DEFAULT_FLOW_TIMEOUT_MS })).toBe(690_000)
        })

        it('follows a raised flow timeout', () => {
            expect(shutdownBudget.drainMs({ flowTimeoutMs: 1_800_000 })).toBe(1_890_000)
        })
    })

    describe('forceExitMs', () => {
        it('is the flow timeout plus 105 s, the sum the Helm chart uses for terminationGracePeriodSeconds', () => {
            expect(shutdownBudget.forceExitMs({ flowTimeoutMs: DEFAULT_FLOW_TIMEOUT_MS })).toBe(705_000)
            expect(shutdownBudget.forceExitMs({ flowTimeoutMs: 1_800_000 })).toBe(1_905_000)
        })

        it('leaves the app 5 s to confirm before the drain starts', () => {
            expect(shutdownBudget.BEGIN_SHUTDOWN_TIMEOUT_MS).toBe(5_000)
        })
    })
})
