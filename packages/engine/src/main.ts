import {
    assertNotNullOrUndefined,
    EngineError,
    EngineOperation,
    EngineOperationType,
    EngineResult,
    EngineSocketEvent,
    EngineStderr,
    EngineStdout,
    isNil } from '@activepieces/shared'
import WebSocket from 'ws'
import { execute } from './lib/operations'

const WORKER_ID = process.env.WORKER_ID
const WS_URL = 'ws://127.0.0.1:12345/worker/ws'

process.title = `engine-${WORKER_ID}`
let socket: WebSocket | undefined

async function executeFromSocket(operation: EngineOperation, operationType: EngineOperationType): Promise<void> {
    try {
        const result = await execute(operationType, operation)
        const resultParsed = JSON.parse(JSON.stringify(result))
        const engineResult: EngineResult = {
            result: resultParsed,
        }
        socket?.send(JSON.stringify({
            type: EngineSocketEvent.ENGINE_RESULT,
            data: engineResult,
        }))
    }
    catch (error) {
        const engineError: EngineError = {
            error: error instanceof Error ? error.message : error,
        }
        socket?.send(JSON.stringify({
            type: EngineSocketEvent.ENGINE_ERROR,
            data: engineError,
        }))
    }
}

function setupSocket() {
    assertNotNullOrUndefined(WORKER_ID, 'WORKER_ID')

    socket = new WebSocket(WS_URL, {
        headers: {
            'worker-id': WORKER_ID,
        },
    })

    // Redirect console.log/error to socket
    const originalLog = console.log
    console.log = function (...args) {
        const engineStdout: EngineStdout = {
            message: args.join(' ') + '\n',
        }
        socket?.send(JSON.stringify({
            type: EngineSocketEvent.ENGINE_STDOUT,
            data: engineStdout,
        }))
        originalLog.apply(console, args)
    }

    const originalError = console.error
    console.error = function (...args) {
        const engineStderr: EngineStderr = {
            message: args.join(' ') + '\n',
        }
        socket?.send(JSON.stringify({
            type: EngineSocketEvent.ENGINE_STDERR,
            data: engineStderr,
        }))
        originalError.apply(console, args)
    }

    socket.on('message', (data: string) => {
        try {
            const message = JSON.parse(data)
            if (message.type === EngineSocketEvent.ENGINE_OPERATION) {
                executeFromSocket(message.data.operation, message.data.operationType).catch(e => {
                    const engineError: EngineError = {
                        error: e instanceof Error ? e.message : e,
                    }
                    socket?.send(JSON.stringify({
                        type: EngineSocketEvent.ENGINE_ERROR,
                        data: engineError,
                    }))
                })
            }
        }
        catch (error) {
            console.error('Error handling operation:', error)
        }
    })

    socket.on('close', () => {
        console.log('Socket disconnected, exiting process')
        process.exit(0)
    })
}

if (!isNil(WORKER_ID)) {
    setupSocket()
}
