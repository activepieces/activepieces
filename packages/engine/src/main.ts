import { inspect } from 'util'
import {
    EngineOperation,
    EngineOperationType,
    EngineResponse,
    EngineResponseStatus,
    EngineSocketEvent,
    EngineStderr,
    EngineStdout,
    ERROR_MESSAGES_TO_REDACT,
    isNil,
} from '@activepieces/shared'
import WebSocket from 'ws'
import { EngineGenericError } from './lib/helper/execution-errors'
import { execute } from './lib/operations'
import { utils } from './lib/utils'

const WORKER_ID = process.env.WORKER_ID
const WS_URL = 'ws://127.0.0.1:12345/worker/ws'


process.title = `engine-${WORKER_ID}`
let socket: WebSocket | undefined


function setupSocket() {
    if (isNil(WORKER_ID)) {
        throw new EngineGenericError('WorkerIdNotSetError', 'WORKER_ID environment variable is not set')
    }

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
        let sanitizedArgs = [...args]
        if (typeof args[0] === 'string' && ERROR_MESSAGES_TO_REDACT.some(errorMessage => args[0].includes(errorMessage))) {
            sanitizedArgs = [sanitizedArgs[0], 'REDACTED']
        }
        const engineStderr: EngineStderr = {
            message: sanitizedArgs.join(' ') + '\n',
        }
        socket?.send(JSON.stringify({
            type: EngineSocketEvent.ENGINE_STDERR,
            data: engineStderr,
        }))
       
        originalError.apply(console, sanitizedArgs)
    }

    socket.on('message', async (data: string) => {
        const { error: resultError } = await utils.tryCatchAndThrowOnEngineError(() => onSocketMessage(data))
        if (resultError) {
            const engineError: EngineResponse = {
                response: undefined,
                status: EngineResponseStatus.INTERNAL_ERROR,
                error: utils.formatError(resultError),
            }
            console.error('Error handling operation:', engineError)
            socket?.send(JSON.stringify(engineError))
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

async function onSocketMessage(data: string): Promise<void> {
    const message = JSON.parse(data)
    if (message.type === EngineSocketEvent.ENGINE_OPERATION) {
        const result = await execute(message.data.operationType, message.data.operation)
        const resultParsed = JSON.parse(JSON.stringify(result))
        socket?.send(JSON.stringify({
            type: EngineSocketEvent.ENGINE_RESPONSE,
            data: resultParsed,
        }))
    }
}