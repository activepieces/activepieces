import { afterEach, describe, expect, it } from 'vitest'
import { shutdownTimeoutMs, WorkerSystemProp } from '../../src/lib/config/configs'

describe('shutdownTimeoutMs', () => {
    const key = WorkerSystemProp.WORKER_SHUTDOWN_TIMEOUT_SECONDS

    afterEach(() => {
        delete process.env[key]
    })

    it('defaults to 30 seconds', () => {
        delete process.env[key]
        expect(shutdownTimeoutMs()).toBe(30_000)
    })

    it('uses AP_WORKER_SHUTDOWN_TIMEOUT_SECONDS when it is set', () => {
        process.env[key] = '120'
        expect(shutdownTimeoutMs()).toBe(120_000)
    })

    it('ignores a non-positive value and keeps the default', () => {
        process.env[key] = '0'
        expect(shutdownTimeoutMs()).toBe(30_000)
    })
})
