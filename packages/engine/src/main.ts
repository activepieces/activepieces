import { inspect } from 'util'
import {
    emitWithAck,
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
import { io, type Socket } from 'socket.io-client'
import { EngineGenericError } from './lib/helper/execution-errors'
import { execute } from './lib/operations'
import { utils } from './lib/utils'

const WORKER_ID = process.env.WORKER_ID
const WS_URL = 'http://127.0.0.1:12345'


process.title = `engine-${WORKER_ID}`
let socket: Socket | undefined

export const sendToWorkerWithAck = async (
    type: EngineSocketEvent,
    data: unknown,
): Promise<void> => {
    await emitWithAck(socket, type, data, {
        timeoutMs: 4000,
        retries: 3,
        retryDelayMs: 2000,
    })
}

async function executeFromSocket(operation: EngineOperation, operationType: EngineOperationType): Promise<void> {
    const result = await execute(operationType, operation)
    const resultParsed = JSON.parse(JSON.stringify(result))
    socket?.emit(EngineSocketEvent.ENGINE_RESPONSE, resultParsed)
}

function setupSocket() {
    if (isNil(WORKER_ID)) {
        throw new EngineGenericError('WorkerIdNotSetError', 'WORKER_ID environment variable is not set')
    }

    socket = io(WS_URL, {
        path: '/worker/ws',
        auth: {
            workerId: WORKER_ID,
        },
    })

    // Redirect console.log/error to socket
    const originalLog = console.log
    console.log = function (...args) {
        const engineStdout: EngineStdout = {
            message: args.join(' ') + '\n',
        }
        socket?.emit(EngineSocketEvent.ENGINE_STDOUT, engineStdout)
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
        socket?.emit(EngineSocketEvent.ENGINE_STDERR, engineStderr)
       
        originalError.apply(console, sanitizedArgs)
    }

    socket.on(EngineSocketEvent.ENGINE_OPERATION, async (data: { operation: EngineOperation, operationType: EngineOperationType }) => {
        const { error: resultError } = await utils.tryCatchAndThrowOnEngineError(() =>
            executeFromSocket(data.operation, data.operationType),
        )

        if (resultError) {
            const engineError: EngineResponse = {
                response: undefined,
                status: EngineResponseStatus.INTERNAL_ERROR,
                error: utils.formatError(resultError),
            }
            console.error('Error handling operation:', engineError)
            socket?.emit(EngineSocketEvent.ENGINE_RESPONSE, engineError)
        }
    })

    socket.on('disconnect', () => {
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
    if (socket && socket.connected) {
        const engineStderr: EngineStderr = {
            message: inspect(error),
        }
        socket.emit(EngineSocketEvent.ENGINE_STDERR, engineStderr)
    }
    setTimeout(() => {
        process.exit(1)
    }, 3000)
}
