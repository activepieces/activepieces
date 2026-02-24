import path from 'path'
import { execSync } from 'child_process'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EngineOperationType, EngineResponseStatus, ErrorCode } from '@activepieces/shared'
import { createSandbox } from '../src/lib/sandbox'
import { nsjailProcess } from '../src/lib/nsjail/nsjail-process'
import { createSandboxWebsocketServer } from '../src/lib/websocket-server'
import { SandboxLogger, SandboxSocketEventHandler, SandboxWebsocketServer } from '../src/lib/types'

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

const canRun = isLinux && nsjailInstalled()

const TEST_ENGINE_PATH = path.resolve(__dirname, 'fixtures/test-engine.js')
const TEST_ENGINE_SLOW_PATH = path.resolve(__dirname, 'fixtures/test-engine-slow.js')
const TEST_PORT = 19877

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

describe.skipIf(!canRun)('nsjail e2e', () => {
    let log: SandboxLogger
    let wsServer: SandboxWebsocketServer

    beforeEach(() => {
        log = createTestLogger()
        wsServer = createSandboxWebsocketServer()
        wsServer.init(log, TEST_PORT)
    })

    afterEach(async () => {
        await wsServer.shutdown()
    })

    it('should start a sandboxed process and connect via websocket', async () => {
        const processMaker = nsjailProcess(log)
        const sandbox = createSandbox(log, 'nsjail-start', {
            env: {
                WS_PORT: String(TEST_PORT),
                SANDBOX_ID: 'nsjail-start',
            },
            memoryLimitMb: 256,
            cpuMsPerSec: 1000,
            timeLimitSeconds: 30,
            reusable: false,
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
            memoryLimitMb: 256,
            cpuMsPerSec: 1000,
            timeLimitSeconds: 30,
            reusable: false,
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
            memoryLimitMb: 256,
            cpuMsPerSec: 1000,
            timeLimitSeconds: 30,
            reusable: false,
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
})
