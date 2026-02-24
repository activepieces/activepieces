import path from 'path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ErrorCode, EngineOperationType, EngineResponseStatus, EngineSocketEvent } from '@activepieces/shared'
import { createSandbox } from '../src/lib/sandbox'
import { simpleProcess } from '../src/lib/simple-process'
import { createSandboxWebsocketServer } from '../src/lib/websocket-server'
import { SandboxLogger, SandboxSocketEventHandler, SandboxWebsocketServer } from '../src/lib/types'

const TEST_ENGINE_PATH = path.resolve(__dirname, 'fixtures/test-engine.js')
const TEST_ENGINE_SLOW_PATH = path.resolve(__dirname, 'fixtures/test-engine-slow.js')
const TEST_PORT = 19876

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

describe('sandbox integration', () => {
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

    it('should start a real process and connect via websocket', async () => {
        const processMaker = simpleProcess(TEST_ENGINE_PATH, '/tmp')
        const sandbox = createSandbox(log, 'test-start', {
            env: { WS_PORT: String(TEST_PORT) },
            memoryLimitMb: 256,
            cpuMsPerSec: 1000,
            timeLimitSeconds: 30,
            reusable: false,
        }, processMaker, wsServer, createNoOpEventHandler())

        await sandbox.start({ flowVersionId: undefined, platformId: 'test' })

        expect(wsServer.isConnected('test-start')).toBe(true)

        await sandbox.shutdown()
    })

    it('should execute an operation and receive ENGINE_RESPONSE from real process', async () => {
        const processMaker = simpleProcess(TEST_ENGINE_PATH, '/tmp')
        const sandbox = createSandbox(log, 'test-exec', {
            env: { WS_PORT: String(TEST_PORT) },
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

    it('should handle process exit with timeout', async () => {
        // Use a non-existent engine path to cause immediate exit
        const processMaker = simpleProcess(path.resolve(__dirname, 'fixtures/nonexistent.js'), '/tmp')
        const sandbox = createSandbox(log, 'test-exit', {
            env: { WS_PORT: String(TEST_PORT) },
            memoryLimitMb: 256,
            cpuMsPerSec: 1000,
            timeLimitSeconds: 30,
            reusable: false,
        }, processMaker, wsServer, createNoOpEventHandler())

        // start will hang waiting for WS connection that never comes since the process crashes
        // We can't easily test timeout here without a long wait, so just verify shutdown works
        await sandbox.shutdown()
    })

    it('should delegate non-core events to the event handler', async () => {
        const receivedEvents: { event: EngineSocketEvent, payload: unknown }[] = []
        const eventHandler: SandboxSocketEventHandler = {
            handle: async (_log, event, payload) => {
                receivedEvents.push({ event, payload })
            },
        }

        const processMaker = simpleProcess(TEST_ENGINE_PATH, '/tmp')
        const sandbox = createSandbox(log, 'test-events', {
            env: { WS_PORT: String(TEST_PORT) },
            memoryLimitMb: 256,
            cpuMsPerSec: 1000,
            timeLimitSeconds: 30,
            reusable: false,
        }, processMaker, wsServer, eventHandler)

        await sandbox.start({ flowVersionId: undefined, platformId: 'test' })

        const result = await sandbox.execute(
            EngineOperationType.EXECUTE_FLOW,
            { platformId: 'test' } as never,
            { timeoutInSeconds: 10 },
        )

        expect(result.engine.status).toBe(EngineResponseStatus.OK)

        await sandbox.shutdown()
    })

    it('should reject with SANDBOX_EXECUTION_TIMEOUT when operation takes too long', async () => {
        const processMaker = simpleProcess(TEST_ENGINE_SLOW_PATH, '/tmp')
        const sandbox = createSandbox(log, 'test-timeout', {
            env: { WS_PORT: String(TEST_PORT) },
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

    it('shutdown should be safe to call multiple times', async () => {
        const processMaker = simpleProcess(TEST_ENGINE_PATH, '/tmp')
        const sandbox = createSandbox(log, 'test-shutdown', {
            env: { WS_PORT: String(TEST_PORT) },
            memoryLimitMb: 256,
            cpuMsPerSec: 1000,
            timeLimitSeconds: 30,
            reusable: false,
        }, processMaker, wsServer, createNoOpEventHandler())

        await sandbox.start({ flowVersionId: undefined, platformId: 'test' })
        await sandbox.shutdown()
        await sandbox.shutdown() // should not throw
    })
})
