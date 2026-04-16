import { inspect } from 'node:util'
import {
    createNotifyClient,
    createRpcClient,
    createRpcServer,
    EngineContract,
    EngineResponse,
    ERROR_MESSAGES_TO_REDACT,
    WorkerContract,
    WorkerNotifyContract,
} from '@activepieces/shared'
import { io, type Socket } from 'socket.io-client'
import { runProgressService } from './handler/run-progress'
import { execute } from './operations'

let socket: Socket | undefined
let workerClient: WorkerContract | undefined
let notifyClient: WorkerNotifyContract | undefined

export const workerSocket = {
    init: (sandboxId: string): void => {
        const wsUrl = `ws://127.0.0.1:${process.env.AP_SANDBOX_WS_PORT ?? '12345'}`
        socket = io(wsUrl, {
            path: '/worker/ws',
            auth: { sandboxId },
            autoConnect: false,
            reconnection: true,
        })

        workerClient = createRpcClient<WorkerContract>(socket, 60_000)
        notifyClient = createNotifyClient<WorkerNotifyContract>(socket)

        const originalLog = console.log
        console.log = function (...args): void {
            notifyClient?.stdout({ message: args.join(' ') + '\n' })
            originalLog.apply(console, args)
        }

        const originalWarn = console.warn
        console.warn = function (...args): void {
            notifyClient?.stdout({ message: args.join(' ') + '\n' })
            originalWarn.apply(console, args)
        }

        const originalError = console.error
        console.error = function (...args): void {
            let sanitizedArgs = [...args]
            if (typeof args[0] === 'string' && ERROR_MESSAGES_TO_REDACT.some(m => args[0].includes(m))) {
                sanitizedArgs = [sanitizedArgs[0], 'REDACTED']
            }
            notifyClient?.stderr({ message: sanitizedArgs.join(' ') + '\n' })
            originalError.apply(console, sanitizedArgs)
        }

        createRpcServer<EngineContract>(socket, {
            executeOperation: async ({ operationType, operation }): Promise<EngineResponse<unknown>> => {
                runProgressService.init()
                try {
                    const response = await execute(operationType, operation)
                    return JSON.parse(JSON.stringify(response)) as EngineResponse<unknown>
                }
                finally {
                    await runProgressService.shutdown()
                }
            },
        })

        const gc = global.gc
        if (typeof gc === 'function') {
            const GC_INTERVAL_MS = 60_000
            setInterval(() => {
                gc()
            }, GC_INTERVAL_MS)
        }

        socket.connect()
    },

    getWorkerClient: (): WorkerContract => {
        if (!workerClient) throw new Error('Worker client not initialized')
        return workerClient
    },

    sendError: (error: unknown): void => {
        notifyClient?.stderr({ message: inspect(error) })
    },
}
