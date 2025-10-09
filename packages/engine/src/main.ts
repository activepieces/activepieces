import { inspect } from 'util'
import {
    assertNotNullOrUndefined,
    EngineOperation,
    EngineOperationType,
    EngineResponse,
    EngineResponseStatus,
    EngineSocketEvent,
    EngineStderr,
    EngineStdout,
    isNil,
} from '@activepieces/shared'
import WebSocket from 'ws'
import { execute } from './lib/operations'
import { utils } from './lib/utils'

const WORKER_ID = process.env.WORKER_ID
const WS_URL = 'ws://127.0.0.1:12345/worker/ws'


process.title = `engine-${WORKER_ID}`
let socket: WebSocket | undefined

async function executeFromSocket(operation: EngineOperation, operationType: EngineOperationType): Promise<void> {
    const result = await execute(operationType, operation)
    const resultParsed = JSON.parse(JSON.stringify(result))
    socket?.send(JSON.stringify({
        type: EngineSocketEvent.ENGINE_RESPONSE,
        data: resultParsed,
    }))
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
                    const engineError: EngineResponse = {
                        response: undefined,
                        status: EngineResponseStatus.INTERNAL_ERROR,
                        error: utils.formatError(e),
                    }
                    socket?.send(JSON.stringify(engineError))
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


process.on('uncaughtException', (error) => sendToErrorSocket(error))
process.on('unhandledRejection', (reason) => sendToErrorSocket(reason))

function sendToErrorSocket(error: unknown) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const engineStderr: EngineStderr = {
            message: inspect(error),
        }
        socket.send(JSON.stringify({
            type: EngineSocketEvent.ENGINE_STDERR,
            data: engineStderr,
        }))
    }
    setTimeout(() => {
        process.exit(1)
    }, 3000)
}