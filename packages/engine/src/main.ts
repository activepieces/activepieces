import {
    EngineOperation,
    EngineOperationType,
    EngineSocketEvent,
    EngineResult,
    EngineError,
    EngineStdout,
    EngineStderr,
    isNil,
} from '@activepieces/shared'
import { execute } from './lib/operations'
import { io } from 'socket.io-client'
import { assertNotNullOrUndefined } from '@activepieces/shared'

const WORKER_ID = process.env.WORKER_ID
const WS_URL = 'http://127.0.0.1:12345'

let socket: ReturnType<typeof io> | undefined

async function executeFromSocket(operation: EngineOperation, operationType: EngineOperationType): Promise<void> {
    try {
        const result = await execute(operationType, operation)
        const resultParsed = JSON.parse(JSON.stringify(result))
        const engineResult: EngineResult = {
            result: resultParsed,
        }
        socket?.emit(EngineSocketEvent.ENGINE_RESULT, engineResult)
    }
    catch (error) {
        const engineError: EngineError = {
            error: error instanceof Error ? error.message : error,
        }
        socket?.emit(EngineSocketEvent.ENGINE_ERROR, engineError)
    }
}

function setupSocket() {
    assertNotNullOrUndefined(WORKER_ID, 'WORKER_ID')

    socket = io(WS_URL, {
        path: '/worker/ws',
        extraHeaders: {
            'worker-id': WORKER_ID
        }
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
        const engineStderr: EngineStderr = {
            message: args.join(' ') + '\n',
        }
        socket?.emit(EngineSocketEvent.ENGINE_STDERR, engineStderr)
        originalError.apply(console, args)
    }

    socket.on(EngineSocketEvent.ENGINE_OPERATION, (data) => {
        try {
            executeFromSocket(data.operation, data.operationType).catch(e => {
                const engineError: EngineError = {
                    error: e instanceof Error ? e.message : e,
                }
                socket?.emit(EngineSocketEvent.ENGINE_ERROR, engineError)
            })
        } catch (error) {
            console.error('Error handling operation:', error)
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
