import http from 'node:http'
import { inspect } from 'node:util'
import {
    createNotifyClient,
    createRpcClient,
    createRpcServer,
    EngineContract,
    EngineResponse,
    ERROR_MESSAGES_TO_REDACT,
    NetworkMode,
    WorkerContract,
    WorkerNotifyContract,
} from '@activepieces/shared'
import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client'
import { flowRunProgressReporter } from './helper/flow-run-progress-reporter'
import { execute } from './operations'

const INITIAL_CONNECT_TIMEOUT_MS = 60_000

let socket: Socket | undefined
let workerClient: WorkerContract | undefined
let notifyClient: WorkerNotifyContract | undefined

export const workerSocket = {
    init: (sandboxId: string): void => {
        const wsUrl = `ws://127.0.0.1:${process.env.AP_SANDBOX_WS_PORT ?? '12345'}`
        socket = io(wsUrl, buildSocketOptions(sandboxId))

        // Without this watchdog, if the parent worker is SIGKILLed (OOM, crash) before
        // the engine ever connects, the engine sits forever retrying the handshake on a
        // dead port — orphaned, idle, holding ~80 MB. The worker is the only thing that
        // can kill us, so if it's not there to talk to, we self-terminate.
        const initialConnectWatchdog = setTimeout(() => {
            // eslint-disable-next-line no-console
            console.error('[engine] Failed to connect to worker within 60s, exiting')
            process.exit(5)
        }, INITIAL_CONNECT_TIMEOUT_MS)

        workerClient = createRpcClient<WorkerContract>(socket, 60_000)
        notifyClient = createNotifyClient<WorkerNotifyContract>(socket)

        socket.on('connect', () => {
            clearTimeout(initialConnectWatchdog)
        })

        // Same rationale as the watchdog: once the control channel is gone, this engine
        // can never reattach (worker rotates the handshake token per start()), so we'd
        // just be a zombie sandbox-* process accumulating until the next host OOM.
        // Exclude 'io client disconnect' so the engine's own workerSocket.disconnect()
        // path (used by tests) doesn't fire process.exit on the test runner.
        socket.on('disconnect', (reason) => {
            if (reason === 'io client disconnect') {
                return
            }
            // eslint-disable-next-line no-console
            console.error(`[engine] Worker socket disconnected (${reason}), exiting`)
            process.exit(6)
        })

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
                flowRunProgressReporter.init()
                try {
                    const response = await execute(operationType, operation)
                    return JSON.parse(JSON.stringify(response)) as EngineResponse<unknown>
                }
                finally {
                    await flowRunProgressReporter.shutdown()
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

    disconnect: (): void => {
        socket?.disconnect()
        socket = undefined
        workerClient = undefined
        notifyClient = undefined
    },
}

function buildSocketOptions(sandboxId: string): Partial<ManagerOptions & SocketOptions> {
    const base: Partial<ManagerOptions & SocketOptions> = {
        path: '/worker/ws',
        auth: {
            sandboxId,
            connectionToken: process.env.AP_SANDBOX_WS_TOKEN,
        },
        autoConnect: false,
        // Engines are one-shot per sandbox. The worker rotates the handshake token on
        // every start(), so any reconnect attempt after a disconnect is permanently
        // unauthorized — looping just turns the engine into a zombie. Self-exit on
        // disconnect (above) handles teardown.
        reconnection: false,
    }
    // In STRICT mode ssrf-guard rebinds http.globalAgent to HttpProxyAgent; a
    // plain http.Agent here keeps the loopback worker RPC handshake off the proxy.
    if (process.env['AP_NETWORK_MODE'] === NetworkMode.STRICT) {
        Object.assign(base, { agent: new http.Agent() })
    }
    return base
}
