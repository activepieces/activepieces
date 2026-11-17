import { describe, expect, it } from 'vitest'
import { shutdownBudget } from '../../src/lib/config/shutdown-budget'

const DEFAULT_FLOW_TIMEOUT_MS = 600_000

describe('shutdownBudget', () => {
    describe('drainMs', () => {
        it('waits one flow timeout plus a minute', () => {
            expect(shutdownBudget.drainMs({ flowTimeoutMs: DEFAULT_FLOW_TIMEOUT_MS })).toBe(660_000)
        })

        it('follows a raised flow timeout', () => {
            expect(shutdownBudget.drainMs({ flowTimeoutMs: 1_800_000 })).toBe(1_860_000)
        })
    })

    describe('forceExitMs', () => {
        it('is the flow timeout plus 75 s, the sum the Helm chart uses for terminationGracePeriodSeconds', () => {
            expect(shutdownBudget.forceExitMs({ flowTimeoutMs: DEFAULT_FLOW_TIMEOUT_MS })).toBe(675_000)
            expect(shutdownBudget.forceExitMs({ flowTimeoutMs: 1_800_000 })).toBe(1_875_000)
        })

        it('leaves the app 5 s to confirm before the drain starts', () => {
            expect(shutdownBudget.BEGIN_SHUTDOWN_TIMEOUT_MS).toBe(5_000)
        })
    })
})
