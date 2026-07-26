import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { EngineResponseStatus } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const acquiredBoxIds: number[] = []
const runTimeouts: number[] = []

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
                start: vi.fn().mockResolvedValue(undefined),
                execute: vi.fn((_operationType: unknown, _operation: unknown, options: { timeoutInSeconds: number }) => {
                    runTimeouts.push(options.timeoutInSeconds)
                    return Promise.resolve({ status: EngineResponseStatus.OK, response: {}, logs: undefined })
                }),
            }
        }),
        release: vi.fn().mockResolvedValue(undefined),
        invalidate: vi.fn().mockResolvedValue(undefined),
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

describe('createSandboxRuntime concurrency', () => {
    beforeEach(() => {
        acquiredBoxIds.length = 0
        runTimeouts.length = 0
        vi.clearAllMocks()
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

    it('clamps the run to what is left of the caller deadline', async () => {
        const runtime = createSandboxRuntime({ basePath: '/tmp', getSettings: () => ({} as never), log })
        await runtime.execute(buildExecuteParams(0, Date.now() + 30 * 1000))
        expect(runTimeouts[0]).toBeGreaterThan(25)
        expect(runTimeouts[0]).toBeLessThanOrEqual(30)
    })

    it('keeps the given timeout when there is no caller deadline', async () => {
        const runtime = createSandboxRuntime({ basePath: '/tmp', getSettings: () => ({} as never), log })
        await runtime.execute(buildExecuteParams(0))
        expect(runTimeouts).toEqual([60])
    })

    it('never starts the operation once the caller deadline has passed', async () => {
        const runtime = createSandboxRuntime({ basePath: '/tmp', getSettings: () => ({} as never), log })
        const error = await runtime.execute(buildExecuteParams(0, Date.now() - 1000)).catch((e: unknown) => e)
        expect((error as ActivepiecesError).error.code).toBe(ErrorCode.SANDBOX_EXECUTION_TIMEOUT)
        expect(runTimeouts).toEqual([])
    })

    it('defaults to a single box when concurrency is omitted', async () => {
        const { createSandboxManager } = await import('../../src/lib/sandbox-manager')
        createSandboxRuntime({ basePath: '/tmp', getSettings: () => ({} as never), log })
        expect(createSandboxManager).toHaveBeenCalledTimes(1)
    })
})
