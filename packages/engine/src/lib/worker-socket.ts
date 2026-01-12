import { inspect } from 'util'
import {
    emitWithAck,
    EngineGenericError,
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
import { execute } from './operations'
import { utils } from './utils'

const WORKER_ID = process.env.WORKER_ID
const WS_URL = 'ws://127.0.0.1:12345'

let socket: Socket | undefined

async function executeFromSocket(operation: EngineOperation, operationType: EngineOperationType): Promise<void> {
    const result = await execute(operationType, operation)
    const resultParsed = JSON.parse(JSON.stringify(result))
    await workerSocket.sendToWorkerWithAck(EngineSocketEvent.ENGINE_RESPONSE, resultParsed)
}

export const workerSocket = {
    init: (): void => {
        if (isNil(WORKER_ID)) {
            throw new EngineGenericError('WorkerIdNotSetError', 'WORKER_ID environment variable is not set')
        }

        socket = io(WS_URL, {
            path: '/worker/ws',
            auth: {
                workerId: WORKER_ID,
            },
            autoConnect: true,
            reconnection: true,
        })

        // Redirect console.log/error/warn to socket
        const originalLog = console.log
        console.log = function (...args): void {
            const engineStdout: EngineStdout = {
                message: args.join(' ') + '\n',
            }
            socket?.emit(EngineSocketEvent.ENGINE_STDOUT, engineStdout)
            originalLog.apply(console, args)
        }

        const originalWarn = console.warn
        console.warn = function (...args): void {
            const engineStdout: EngineStdout = {
                message: args.join(' ') + '\n',
            }
            socket?.emit(EngineSocketEvent.ENGINE_STDOUT, engineStdout)
            originalWarn.apply(console, args)
        }

        const originalError = console.error
        console.error = function (...args): void {
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
                    error: utils.formatExecutionError(resultError),
                }
                console.error(utils.formatExecutionError(resultError))
                await workerSocket.sendToWorkerWithAck(EngineSocketEvent.ENGINE_RESPONSE, engineError)
            }
        })


    },

    sendToWorkerWithAck: async (
        type: EngineSocketEvent,
        data: unknown,
    ): Promise<void> => {
        await emitWithAck(socket, type, data, {
            timeoutMs: 4000,
            retries: 4,
            retryDelayMs: 1000,
        })
    },

    sendError: async (error: unknown): Promise<void> => {
        const engineStderr: EngineStderr = {
            message: inspect(error),
        }
        await emitWithAck(socket, EngineSocketEvent.ENGINE_STDERR, engineStderr, {
            timeoutMs: 3000,
            retries: 4,
            retryDelayMs: 1000,
        })
    },
}
