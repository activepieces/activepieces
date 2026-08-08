import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { EngineResponseStatus } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const acquiredBoxIds: number[] = []
const runTimeouts: number[] = []
const managerCalls = { release: 0, invalidate: 0 }
let bootAdvanceMs = 0

vi.mock('@activepieces/server-utils', async (importActual) => {
    const actual = await importActual<typeof import('@activepieces/server-utils')>()
    return {
        ...actual,
        wideEvent: {
            ...actual.wideEvent,
            timed: vi.fn(({ fn }: { fn: () => unknown }) => fn()),
        },
    }
})

vi.mock('../../src/lib/cache/local-execution-cache', () => ({
    localExecutionCache: () => ({ provision: vi.fn().mockResolvedValue(undefined) }),
}))

vi.mock('../../src/lib/sandbox-manager', () => ({
    createSandboxManager: vi.fn(({ boxId }: { boxId: number }) => ({
        acquire: vi.fn(() => {
            acquiredBoxIds.push(boxId)
            return {
                start: vi.fn(() => {
                    if (bootAdvanceMs > 0) {
                        vi.setSystemTime(Date.now() + bootAdvanceMs)
                    }
                    return Promise.resolve()
                }),
                execute: vi.fn((_operationType: unknown, _operation: unknown, options: { timeoutInSeconds: number }) => {
                    runTimeouts.push(options.timeoutInSeconds)
                    return Promise.resolve({ status: EngineResponseStatus.OK, response: {}, logs: undefined })
                }),
            }
        }),
        release: vi.fn(() => {
            managerCalls.release++
            return Promise.resolve()
        }),
        invalidate: vi.fn(() => {
            managerCalls.invalidate++
            return Promise.resolve()
        }),
        shutdown: vi.fn().mockResolvedValue(undefined),
        getActiveSandbox: vi.fn(() => ({ sandboxId: `sb-${boxId}`, boxId, pid: 1000 + boxId, busy: false })),
    })),
}))

import { createSandboxRuntime } from '../../src/lib/sandbox'

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never

function buildExecuteParams(workerIndex: number, expiresAt?: number) {
    return {
        workerIndex,
        log,
        operationType: 'EXECUTE_FLOW',
        operation: {},
        timeoutInSeconds: 60,
        expiresAt,
        provision: {
            platformId: 'p1',
            flowVersionId: 'fv1',
            pieces: [],
            codes: [],
            publicApiUrl: 'http://localhost/api/',
            engineToken: 't',
        },
    } as never
}

describe('createSandboxRuntime', () => {
    beforeEach(() => {
        acquiredBoxIds.length = 0
        runTimeouts.length = 0
        managerCalls.release = 0
        managerCalls.invalidate = 0
        bootAdvanceMs = 0
        vi.clearAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('builds N boxes (one manager per workerIndex)', async () => {
        const { createSandboxManager } = await import('../../src/lib/sandbox-manager')
        createSandboxRuntime({ concurrency: 3, basePath: '/tmp', getSettings: () => ({} as never), log })
        expect(createSandboxManager).toHaveBeenCalledTimes(3)
        expect(vi.mocked(createSandboxManager).mock.calls.map(([arg]) => arg.boxId)).toEqual([1, 2, 3])
    })

    it('routes each execute to its own box by workerIndex', async () => {
        const runtime = createSandboxRuntime({ concurrency: 3, basePath: '/tmp', getSettings: () => ({} as never), log })
        await runtime.execute(buildExecuteParams(0))
        await runtime.execute(buildExecuteParams(2))
        expect(acquiredBoxIds).toEqual([1, 3])
    })

    it('getActiveExecutors flattens all boxes', async () => {
        const runtime = createSandboxRuntime({ concurrency: 2, basePath: '/tmp', getSettings: () => ({} as never), log })
        const executors = runtime.getActiveExecutors()
        expect(executors.map((e) => e.boxId)).toEqual([1, 2])
    })

    it('throws VALIDATION when workerIndex is out of bounds', async () => {
        const runtime = createSandboxRuntime({ concurrency: 2, basePath: '/tmp', getSettings: () => ({} as never), log })
        const error = await runtime.execute(buildExecuteParams(5)).catch((e: unknown) => e)
        expect(error).toBeInstanceOf(ActivepiecesError)
        expect((error as ActivepiecesError).error.code).toBe(ErrorCode.VALIDATION)
    })

    it('defaults to a single box when concurrency is omitted', async () => {
        const { createSandboxManager } = await import('../../src/lib/sandbox-manager')
        createSandboxRuntime({ basePath: '/tmp', getSettings: () => ({} as never), log })
        expect(createSandboxManager).toHaveBeenCalledTimes(1)
    })

    it('keeps the given timeout when there is no caller deadline', async () => {
        const runtime = createSandboxRuntime({ basePath: '/tmp', getSettings: () => ({} as never), log })
        await runtime.execute(buildExecuteParams(0))
        expect(runTimeouts).toEqual([60])
    })

    it.each([
        { label: 'no boot time consumed', deadlineMs: 30 * 1000, bootAdvance: 0, expectedTimeoutInSeconds: 30 },
        { label: 'boot consumes part of the budget', deadlineMs: 60 * 1000, bootAdvance: 40 * 1000, expectedTimeoutInSeconds: 20 },
    ])('clamps the run to what is left of the caller deadline ($label)', async ({ deadlineMs, bootAdvance, expectedTimeoutInSeconds }) => {
        bootAdvanceMs = bootAdvance
        const runtime = createSandboxRuntime({ basePath: '/tmp', getSettings: () => ({} as never), log })
        await runtime.execute(buildExecuteParams(0, Date.now() + deadlineMs))
        expect(runTimeouts).toEqual([expectedTimeoutInSeconds])
    })

    it.each([
        { label: 'deadline already passed before boot', deadlineMs: -1000, bootAdvance: 0 },
        { label: 'boot consumed the whole deadline', deadlineMs: 60 * 1000, bootAdvance: 70 * 1000 },
    ])('never starts the operation once the caller deadline has passed ($label)', async ({ deadlineMs, bootAdvance }) => {
        bootAdvanceMs = bootAdvance
        const runtime = createSandboxRuntime({ basePath: '/tmp', getSettings: () => ({} as never), log })
        const error = await runtime.execute(buildExecuteParams(0, Date.now() + deadlineMs)).catch((e: unknown) => e)
        expect((error as ActivepiecesError).error.code).toBe(ErrorCode.SANDBOX_EXECUTION_TIMEOUT)
        expect((error as ActivepiecesError).error.params).toMatchObject({ neverStarted: true })
        expect(runTimeouts).toEqual([])
        expect(managerCalls.invalidate).toBe(1)
        expect(managerCalls.release).toBe(0)
    })
})
