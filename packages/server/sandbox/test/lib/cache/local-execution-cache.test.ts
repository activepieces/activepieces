import { randomUUID } from 'node:crypto'
import { readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ApLogger } from '@activepieces/server-utils'
import { ExecutionMode, FlowVersionState, NetworkMode } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { processCodeStepMock, engineInstallMock } = vi.hoisted(() => ({
    processCodeStepMock: vi.fn(),
    engineInstallMock: vi.fn(),
}))

vi.mock('../../../src/lib/cache/flow/code/code-builder', () => ({
    codeBuilder: () => ({ processCodeStep: processCodeStepMock }),
}))

vi.mock('../../../src/lib/cache/engine/engine-installer', () => ({
    engineInstaller: () => ({ install: engineInstallMock }),
}))

// eslint-disable-next-line import/first
import { cacheUtils } from '../../../src/lib/cache/cache-paths'
// eslint-disable-next-line import/first
import { localExecutionCache } from '../../../src/lib/cache/local-execution-cache'
// eslint-disable-next-line import/first
import { SandboxSettings } from '../../../src/lib/types'

const basePaths: string[] = []

function uniqueBasePath(): string {
    const basePath = join(tmpdir(), `local-execution-cache-test-${randomUUID()}`)
    basePaths.push(basePath)
    return basePath
}

const noopLog = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
} as unknown as ApLogger

const getSettings = (): SandboxSettings => ({
    EXECUTION_MODE: ExecutionMode.SANDBOX_CODE_AND_PROCESS,
    DEV_PIECES: [],
    ENVIRONMENT: 'PRODUCTION',
    REUSE_SANDBOX: undefined,
    FLOW_TIMEOUT_SECONDS: 600,
    MAX_FILE_SIZE_MB: 10,
    MAX_FLOW_RUN_LOG_SIZE_MB: 10,
    NETWORK_MODE: NetworkMode.UNRESTRICTED,
    SANDBOX_MEMORY_LIMIT: '256',
    SANDBOX_PROPAGATED_ENV_VARS: [],
    SSRF_ALLOW_LIST: [],
})

function buildArtifact() {
    return {
        name: 'step_1',
        flowVersionId: `fv-${randomUUID()}`,
        flowVersionState: FlowVersionState.LOCKED,
        sourceCode: {
            code: 'export const code = async () => 42',
            packageJson: '{}',
        },
        useDeno: true,
    }
}

function locksPathOf(basePath: string): string {
    return join(cacheUtils(basePath).getGlobalCachePathLatestVersion(), 'code-cache-locks')
}

beforeEach(() => {
    processCodeStepMock.mockReset()
    engineInstallMock.mockReset()
    engineInstallMock.mockResolvedValue({ cacheHit: true })
})

afterEach(async () => {
    for (const basePath of basePaths) {
        await rm(basePath, { recursive: true, force: true })
    }
    basePaths.length = 0
})

describe('localExecutionCache.provision', () => {
    it('builds every code step while holding its per-dir disk lock, and releases it afterwards', async () => {
        const basePath = uniqueBasePath()
        const locksPath = locksPathOf(basePath)
        let lockFilesDuringBuild: string[] | null = null
        processCodeStepMock.mockImplementation(async () => {
            lockFilesDuringBuild = await readdir(locksPath)
            return 'success'
        })

        await localExecutionCache(noopLog, basePath, getSettings).provision({
            pieces: [],
            codeSteps: [buildArtifact()],
            internalApiUrl: 'http://127.0.0.1:3000',
            engineToken: 'engine-token',
        })

        expect(processCodeStepMock).toHaveBeenCalledTimes(1)
        expect(lockFilesDuringBuild).not.toBeNull()
        expect(lockFilesDuringBuild!.filter((name) => name.endsWith('.lock'))).toHaveLength(1)
        const lockFilesAfter = await readdir(locksPath)
        expect(lockFilesAfter.filter((name) => name.endsWith('.lock'))).toHaveLength(0)
    })
})
