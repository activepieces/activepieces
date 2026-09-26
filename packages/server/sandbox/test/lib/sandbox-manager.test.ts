import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApEnvironment, ExecutionMode, NetworkMode } from '@activepieces/shared'

vi.mock('../../src/lib/create-sandbox-for-job', () => ({
    createSandboxForJob: vi.fn().mockReturnValue({
        isReady: () => true,
        shutdown: vi.fn().mockResolvedValue(undefined),
    }),
}))

import { createSandboxManager } from '../../src/lib/sandbox-manager'

const log = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnValue({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
} as never

function buildSettings({ executionMode, environment }: { executionMode: string, environment: string }) {
    return {
        PUBLIC_URL: 'http://localhost:3000',
        TRIGGER_TIMEOUT_SECONDS: 60,
        TRIGGER_HOOKS_TIMEOUT_SECONDS: 60,
        PAUSED_FLOW_TIMEOUT_DAYS: 30,
        EXECUTION_MODE: executionMode,
        FLOW_TIMEOUT_SECONDS: 600,
        LOG_LEVEL: 'info',
        LOG_PRETTY: 'false',
        ENVIRONMENT: environment,
        APP_WEBHOOK_SECRETS: '{}',
        MAX_FLOW_RUN_LOG_SIZE_MB: 10,
        MAX_FILE_SIZE_MB: 10,
        SANDBOX_MEMORY_LIMIT: '1024',
        SANDBOX_PROPAGATED_ENV_VARS: [] as string[],
        DEV_PIECES: [] as string[],
        OTEL_ENABLED: false,
        FILE_STORAGE_LOCATION: '/tmp',
        S3_USE_SIGNED_URLS: 'false',
        EVENT_DESTINATION_TIMEOUT_SECONDS: 30,
        EDITION: 'community',
        NETWORK_MODE: NetworkMode.UNRESTRICTED,
        SSRF_ALLOW_LIST: [] as string[],
        REUSE_SANDBOX: undefined as string | undefined,
    }
}

describe('sandbox-manager canReuseSandbox', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('SANDBOX_PROCESS mode → sandbox NOT reusable (release invalidates)', async () => {
        const settings = buildSettings({
            executionMode: ExecutionMode.SANDBOX_PROCESS,
            environment: ApEnvironment.PRODUCTION,
        })

        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })
        manager.acquire({ log })
        await manager.release(log)

        const { createSandboxForJob } = await import('../../src/lib/create-sandbox-for-job')
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)

        manager.acquire({ log })
        expect(createSandboxForJob).toHaveBeenCalledTimes(2)
    })

    it('SANDBOX_CODE_AND_PROCESS mode → sandbox NOT reusable (release invalidates)', async () => {
        const settings = buildSettings({
            executionMode: ExecutionMode.SANDBOX_CODE_AND_PROCESS,
            environment: ApEnvironment.PRODUCTION,
        })

        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })
        manager.acquire({ log })
        await manager.release(log)

        const { createSandboxForJob } = await import('../../src/lib/create-sandbox-for-job')
        manager.acquire({ log })
        expect(createSandboxForJob).toHaveBeenCalledTimes(2)
    })

    it('SANDBOX_CODE_ONLY mode → sandbox reusable (release does NOT invalidate)', async () => {
        const settings = buildSettings({
            executionMode: ExecutionMode.SANDBOX_CODE_ONLY,
            environment: ApEnvironment.PRODUCTION,
        })

        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })
        manager.acquire({ log })
        await manager.release(log)

        const { createSandboxForJob } = await import('../../src/lib/create-sandbox-for-job')
        manager.acquire({ log })
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)
    })

    it('UNSANDBOXED mode → sandbox reusable (release does NOT invalidate)', async () => {
        const settings = buildSettings({
            executionMode: ExecutionMode.UNSANDBOXED,
            environment: ApEnvironment.PRODUCTION,
        })

        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })
        manager.acquire({ log })
        await manager.release(log)

        const { createSandboxForJob } = await import('../../src/lib/create-sandbox-for-job')
        manager.acquire({ log })
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)
    })

    it('DEVELOPMENT environment → sandbox reusable regardless of execution mode', async () => {
        const settings = buildSettings({
            executionMode: ExecutionMode.SANDBOX_PROCESS,
            environment: ApEnvironment.DEVELOPMENT,
        })

        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })
        manager.acquire({ log })
        await manager.release(log)

        const { createSandboxForJob } = await import('../../src/lib/create-sandbox-for-job')
        manager.acquire({ log })
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)
    })
})

describe('sandbox-manager dev piece rebuilds', () => {
    const originalCwd = process.cwd()
    let workspace: string
    let distPackageJson: string

    beforeEach(() => {
        vi.clearAllMocks()
        workspace = mkdtempSync(path.join(tmpdir(), 'sandbox-manager-'))
        const distDir = path.join(workspace, 'packages', 'pieces', 'core', 'csv', 'dist')
        mkdirSync(distDir, { recursive: true })
        distPackageJson = path.join(distDir, 'package.json')
        writeFileSync(distPackageJson, '{}')
        utimesSync(distPackageJson, 1000, 1000)
        process.chdir(workspace)
    })

    afterEach(() => {
        process.chdir(originalCwd)
        rmSync(workspace, { recursive: true, force: true })
    })

    function buildDevSettings({ reuseSandbox }: { reuseSandbox: string | undefined }) {
        return {
            ...buildSettings({ executionMode: ExecutionMode.UNSANDBOXED, environment: ApEnvironment.DEVELOPMENT }),
            DEV_PIECES: ['csv'],
            REUSE_SANDBOX: reuseSandbox,
        }
    }

    it('reuses the sandbox while the dev piece is not rebuilt', async () => {
        const settings = buildDevSettings({ reuseSandbox: undefined })
        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })
        manager.acquire({ log })
        await manager.release(log)
        manager.acquire({ log })

        const { createSandboxForJob } = await import('../../src/lib/create-sandbox-for-job')
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)
    })

    it('replaces the sandbox after the dev piece is rebuilt', async () => {
        const settings = buildDevSettings({ reuseSandbox: undefined })
        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })
        manager.acquire({ log })
        await manager.release(log)
        utimesSync(distPackageJson, 2000, 2000)
        manager.acquire({ log })
        manager.acquire({ log })

        const { createSandboxForJob } = await import('../../src/lib/create-sandbox-for-job')
        expect(createSandboxForJob).toHaveBeenCalledTimes(2)
    })

    it('replaces the sandbox after a rebuild even when AP_REUSE_SANDBOX=true', async () => {
        const settings = buildDevSettings({ reuseSandbox: 'true' })
        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })
        manager.acquire({ log })
        utimesSync(distPackageJson, 2000, 2000)
        manager.acquire({ log })

        const { createSandboxForJob } = await import('../../src/lib/create-sandbox-for-job')
        expect(createSandboxForJob).toHaveBeenCalledTimes(2)
    })

    it('replaces the sandbox when the dev piece dist appears for the first time', async () => {
        rmSync(distPackageJson)
        const settings = buildDevSettings({ reuseSandbox: undefined })
        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })
        manager.acquire({ log })
        writeFileSync(distPackageJson, '{}')
        manager.acquire({ log })

        const { createSandboxForJob } = await import('../../src/lib/create-sandbox-for-job')
        expect(createSandboxForJob).toHaveBeenCalledTimes(2)
    })
})
