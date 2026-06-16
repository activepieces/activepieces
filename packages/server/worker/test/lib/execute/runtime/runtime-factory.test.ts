import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createWorkerPoolRuntimeMock, warnMock } = vi.hoisted(() => ({
    createWorkerPoolRuntimeMock: vi.fn(() => ({ kind: 'worker-pool-runtime' })),
    warnMock: vi.fn(),
}))

vi.mock('../../../../src/lib/config/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: warnMock,
        error: vi.fn(),
        debug: vi.fn(),
    },
}))

vi.mock('../../../../src/lib/execute/runtime/worker-pool/worker-pool-runtime', () => ({
    createWorkerPoolRuntime: createWorkerPoolRuntimeMock,
}))

import { runtimeFactory } from '../../../../src/lib/execute/runtime/runtime-factory'
import { ExecutionRuntime } from '../../../../src/lib/execute/runtime/types'

describe('runtime-factory selected', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete process.env.AP_EXECUTION_RUNTIME
    })

    afterEach(() => {
        delete process.env.AP_EXECUTION_RUNTIME
    })

    it('defaults to WORKER_POOL when unset', () => {
        expect(runtimeFactory.selected()).toBe(ExecutionRuntime.WORKER_POOL)
        expect(warnMock).not.toHaveBeenCalled()
    })

    it('returns the configured runtime when valid', () => {
        process.env.AP_EXECUTION_RUNTIME = ExecutionRuntime.WORKER_POOL
        expect(runtimeFactory.selected()).toBe(ExecutionRuntime.WORKER_POOL)
    })

    it('falls back to WORKER_POOL on an unknown value (with warn)', () => {
        process.env.AP_EXECUTION_RUNTIME = 'NONSENSE'
        expect(runtimeFactory.selected()).toBe(ExecutionRuntime.WORKER_POOL)
        expect(warnMock).toHaveBeenCalledTimes(1)
    })
})

describe('runtime-factory concurrencyFor', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete process.env.AP_WORKER_CONCURRENCY
    })

    afterEach(() => {
        delete process.env.AP_WORKER_CONCURRENCY
    })

    it('WORKER_POOL default is 5 when AP_WORKER_CONCURRENCY is unset', () => {
        expect(runtimeFactory.concurrencyFor(ExecutionRuntime.WORKER_POOL)).toBe(5)
        expect(warnMock).not.toHaveBeenCalled()
    })

    it('honors an explicit AP_WORKER_CONCURRENCY override', () => {
        process.env.AP_WORKER_CONCURRENCY = '12'
        expect(runtimeFactory.concurrencyFor(ExecutionRuntime.WORKER_POOL)).toBe(12)
        expect(warnMock).not.toHaveBeenCalled()
    })

    it('clamps a zero override to 1 with a warn', () => {
        process.env.AP_WORKER_CONCURRENCY = '0'
        expect(runtimeFactory.concurrencyFor(ExecutionRuntime.WORKER_POOL)).toBe(1)
        expect(warnMock).toHaveBeenCalledTimes(1)
    })

    it('clamps a non-integer override to 1 with a warn', () => {
        process.env.AP_WORKER_CONCURRENCY = 'abc'
        expect(runtimeFactory.concurrencyFor(ExecutionRuntime.WORKER_POOL)).toBe(1)
        expect(warnMock).toHaveBeenCalledTimes(1)
    })
})

describe('runtime-factory createRuntime', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete process.env.AP_EXECUTION_RUNTIME
    })

    it('createRuntime builds the WORKER_POOL runtime', () => {
        runtimeFactory.createRuntime({ slot: 1 })
        expect(createWorkerPoolRuntimeMock).toHaveBeenCalledWith({ boxId: 1 })
    })
})
