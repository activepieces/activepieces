import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { EngineResponseStatus } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const acquiredBoxIds: number[] = []

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
                execute: vi.fn().mockResolvedValue({ status: EngineResponseStatus.OK, response: {}, logs: undefined }),
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

function buildExecuteParams(workerIndex: number) {
    return {
        workerIndex,
        log,
        operationType: 'EXECUTE_FLOW',
        operation: {},
        timeoutInSeconds: 60,
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

    it('defaults to a single box when concurrency is omitted', async () => {
        const { createSandboxManager } = await import('../../src/lib/sandbox-manager')
        createSandboxRuntime({ basePath: '/tmp', getSettings: () => ({} as never), log })
        expect(createSandboxManager).toHaveBeenCalledTimes(1)
    })
})
