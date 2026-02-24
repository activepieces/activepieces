import path from 'path'
import { execSync } from 'child_process'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { EngineOperationType, EngineResponseStatus, ErrorCode } from '@activepieces/shared'
import { createSandbox } from '../src/lib/sandbox'
import { nsjailProcess } from '../src/lib/nsjail/nsjail-process'
import { createSandboxWebsocketServer } from '../src/lib/websocket-server'
import { SandboxLogger, SandboxMount, SandboxSocketEventHandler, SandboxWebsocketServer } from '../src/lib/types'

const isLinux = process.platform === 'linux'

function nsjailInstalled(): boolean {
    try {
        execSync('which nsjail', { stdio: 'ignore' })
        return true
    }
    catch {
        return false
    }
}

function cgroupsAvailable(): boolean {
    try {
        // nsjail needs to write '+memory' to cgroup.subtree_control; test that directly
        const result = execSync(
            'echo "+memory" > /sys/fs/cgroup/cgroup.subtree_control 2>&1',
            { stdio: 'pipe', shell: '/bin/sh' },
        ).toString()
        return !result.includes('Device or resource busy')
    }
    catch {
        return false
    }
}

const canRun = isLinux && nsjailInstalled()
const hasCgroups = canRun && cgroupsAvailable()

const TEST_ENGINE_PATH = path.resolve(__dirname, 'fixtures/test-engine.js')
const TEST_ENGINE_SLOW_PATH = path.resolve(__dirname, 'fixtures/test-engine-slow.js')
const TEST_ENGINE_OOM_PATH = path.resolve(__dirname, 'fixtures/test-engine-oom.js')
const TEST_PORT = 19878
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../..')

function createTestLogger(): SandboxLogger {
    return {
        info: () => {},
        debug: () => {},
        error: () => {},
        warn: () => {},
    }
}

function createNoOpEventHandler(): SandboxSocketEventHandler {
    return {
        handle: async () => {},
    }
}

const NSJAIL_MOUNTS: SandboxMount[] = [
    { hostPath: WORKSPACE_ROOT, sandboxPath: WORKSPACE_ROOT },
]

describe.skipIf(!canRun)('nsjail e2e', () => {
    let log: SandboxLogger
    let wsServer: SandboxWebsocketServer

    beforeAll(() => {
        log = createTestLogger()
        wsServer = createSandboxWebsocketServer()
        wsServer.init(log, TEST_PORT)
    })

    afterAll(async () => {
        await wsServer.shutdown()
    })

    it('should start a sandboxed process and connect via websocket', async () => {
        const processMaker = nsjailProcess(log)
        const sandbox = createSandbox(log, 'nsjail-start', {
            env: {
                WS_PORT: String(TEST_PORT),
                SANDBOX_ID: 'nsjail-start',
            },
            memoryLimitMb: 0,
            cpuMsPerSec: 0,
            timeLimitSeconds: 30,
            reusable: false,
            command: ['/usr/local/bin/node', TEST_ENGINE_PATH],
            mounts: NSJAIL_MOUNTS,
        }, processMaker, wsServer, createNoOpEventHandler())

        await sandbox.start({ flowVersionId: undefined, platformId: 'test' })
        expect(wsServer.isConnected('nsjail-start')).toBe(true)
        await sandbox.shutdown()
    })

    it('should execute an operation and receive ENGINE_RESPONSE', async () => {
        const processMaker = nsjailProcess(log)
        const sandbox = createSandbox(log, 'nsjail-exec', {
            env: {
                WS_PORT: String(TEST_PORT),
                SANDBOX_ID: 'nsjail-exec',
            },
            memoryLimitMb: 0,
            cpuMsPerSec: 0,
            timeLimitSeconds: 30,
            reusable: false,
            command: ['/usr/local/bin/node', TEST_ENGINE_PATH],
            mounts: NSJAIL_MOUNTS,
        }, processMaker, wsServer, createNoOpEventHandler())

        await sandbox.start({ flowVersionId: undefined, platformId: 'test' })

        const result = await sandbox.execute(
            EngineOperationType.EXECUTE_FLOW,
            { platformId: 'test' } as never,
            { timeoutInSeconds: 10 },
        )

        expect(result.engine.status).toBe(EngineResponseStatus.OK)
        expect((result.engine.response as Record<string, unknown>).echo).toBe(true)
        expect((result.engine.response as Record<string, unknown>).operationType).toBe(EngineOperationType.EXECUTE_FLOW)

        await sandbox.shutdown()
    })

    it('should reject with SANDBOX_EXECUTION_TIMEOUT when operation hangs', async () => {
        const processMaker = nsjailProcess(log)
        const sandbox = createSandbox(log, 'nsjail-timeout', {
            env: {
                WS_PORT: String(TEST_PORT),
                SANDBOX_ID: 'nsjail-timeout',
            },
            memoryLimitMb: 0,
            cpuMsPerSec: 0,
            timeLimitSeconds: 30,
            reusable: false,
            command: ['/usr/local/bin/node', TEST_ENGINE_SLOW_PATH],
            mounts: NSJAIL_MOUNTS,
        }, processMaker, wsServer, createNoOpEventHandler())

        await sandbox.start({ flowVersionId: undefined, platformId: 'test' })

        await expect(sandbox.execute(
            EngineOperationType.EXECUTE_FLOW,
            { platformId: 'test' } as never,
            { timeoutInSeconds: 1 },
        )).rejects.toMatchObject({
            error: { code: ErrorCode.SANDBOX_EXECUTION_TIMEOUT },
        })

        await sandbox.shutdown()
    }, 10000)

    it('should work without cgroup limits (self-hosted)', async () => {
        const processMaker = nsjailProcess(log)
        const sandbox = createSandbox(log, 'nsjail-no-cgroup', {
            env: {
                WS_PORT: String(TEST_PORT),
                SANDBOX_ID: 'nsjail-no-cgroup',
            },
            memoryLimitMb: 0,
            cpuMsPerSec: 0,
            timeLimitSeconds: 30,
            reusable: false,
            command: ['/usr/local/bin/node', TEST_ENGINE_PATH],
            mounts: NSJAIL_MOUNTS,
        }, processMaker, wsServer, createNoOpEventHandler())

        await sandbox.start({ flowVersionId: undefined, platformId: 'test' })

        const result = await sandbox.execute(
            EngineOperationType.EXECUTE_FLOW,
            { platformId: 'test' } as never,
            { timeoutInSeconds: 10 },
        )

        expect(result.engine.status).toBe(EngineResponseStatus.OK)
        await sandbox.shutdown()
    })

    it.skipIf(!hasCgroups)('should reject with SANDBOX_MEMORY_ISSUE when process exceeds memory limit', async () => {
        const processMaker = nsjailProcess(log)
        const sandbox = createSandbox(log, 'nsjail-oom', {
            env: {
                WS_PORT: String(TEST_PORT),
                SANDBOX_ID: 'nsjail-oom',
            },
            memoryLimitMb: 50,
            cpuMsPerSec: 0,
            timeLimitSeconds: 30,
            reusable: false,
            command: ['/usr/local/bin/node', '--max-old-space-size=200', TEST_ENGINE_OOM_PATH],
            mounts: NSJAIL_MOUNTS,
        }, processMaker, wsServer, createNoOpEventHandler())

        await sandbox.start({ flowVersionId: undefined, platformId: 'test' })

        await expect(sandbox.execute(
            EngineOperationType.EXECUTE_FLOW,
            { platformId: 'test' } as never,
            { timeoutInSeconds: 15 },
        )).rejects.toMatchObject({
            error: { code: ErrorCode.SANDBOX_MEMORY_ISSUE },
        })

        await sandbox.shutdown()
    }, 20000)
})
