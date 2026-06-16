import { AddressInfo, createServer as createNetServer } from 'net'
import { EngineResponseStatus } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { executeMock } = vi.hoisted(() => ({
    executeMock: vi.fn(),
}))

vi.mock('../src/lib/operations', () => ({
    execute: executeMock,
}))

vi.mock('../src/lib/helper/flow-run-progress-reporter', () => ({
    flowRunProgressReporter: {
        init: vi.fn(),
        shutdown: vi.fn().mockResolvedValue(undefined),
    },
}))

import { engineServer } from '../src/lib/engine-server'

function getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = createNetServer()
        server.unref()
        server.on('error', reject)
        server.listen(0, '127.0.0.1', () => {
            const port = (server.address() as AddressInfo).port
            server.close(() => resolve(port))
        })
    })
}

const TOKEN = 'a'.repeat(64)
let baseUrl = ''

describe('engineServer', () => {
    beforeEach(async () => {
        executeMock.mockReset()
        const port = await getFreePort()
        process.env.AP_ENGINE_PORT = String(port)
        process.env.AP_ENGINE_TOKEN = TOKEN
        process.env.AP_MAX_FILE_SIZE_MB = '100'
        baseUrl = `http://127.0.0.1:${port}`
        await engineServer.start()
    })

    afterEach(async () => {
        await engineServer.stop()
    })

    it('answers /health with 200', async () => {
        const response = await fetch(`${baseUrl}/health`)
        expect(response.status).toBe(200)
    })

    it('rejects /execute without a bearer token', async () => {
        const response = await fetch(`${baseUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationType: 'EXECUTE_FLOW', operation: {} }),
        })
        expect(response.status).toBe(401)
        expect(executeMock).not.toHaveBeenCalled()
    })

    it('rejects /execute with the wrong bearer token', async () => {
        const response = await fetch(`${baseUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer wrong' },
            body: JSON.stringify({ operationType: 'EXECUTE_FLOW', operation: {} }),
        })
        expect(response.status).toBe(401)
        expect(executeMock).not.toHaveBeenCalled()
    })

    it('runs the operation and returns engineResponse with captured logs', async () => {
        executeMock.mockImplementation(async () => {
            // eslint-disable-next-line no-console
            console.log('hello from engine')
            return { status: EngineResponseStatus.OK, response: { ok: true } }
        })

        const response = await fetch(`${baseUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
            body: JSON.stringify({ operationType: 'EXECUTE_FLOW', operation: { foo: 'bar' } }),
        })

        expect(response.status).toBe(200)
        const body = await response.json() as { engineResponse: unknown, logs: string }
        expect(body.engineResponse).toEqual({ status: EngineResponseStatus.OK, response: { ok: true } })
        expect(body.logs).toContain('hello from engine')
        expect(executeMock).toHaveBeenCalledWith('EXECUTE_FLOW', { foo: 'bar' })
    })
})
