import { inspect } from 'node:util'
import { getHeapStatistics } from 'node:v8'
import { isNil, tryCatch } from '@activepieces/core-utils'
import {
    createNotifyClient,
    createRpcClient,
    createRpcServer,
    EngineContract,
    EngineResponse,
    ERROR_MESSAGES_TO_REDACT,
    ForceReinstallPieceRequest,
    SandboxHeapUsage,
    WorkerNotifyContract,
    WorkerRpcContract,
} from '@activepieces/shared'
import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client'
import { flowRunProgressReporter } from './helper/flow-run-progress-reporter'
import { pieceMemorySampler } from './helper/piece-memory-sampler'
import { execute } from './operations'

const INITIAL_CONNECT_TIMEOUT_MS = 60_000
const PIECE_REINSTALL_RPC_TIMEOUT_MS = 120_000
const PIECES_MEMORY_REFRESH_INTERVAL_MS = 60_000

let socket: Socket | undefined
let notifyClient: WorkerNotifyContract | undefined
let rpcClient: WorkerRpcContract | undefined
let initialConnectWatchdog: NodeJS.Timeout | undefined

function clearInitialConnectWatchdog(): void {
    if (initialConnectWatchdog) {
        clearTimeout(initialConnectWatchdog)
        initialConnectWatchdog = undefined
    }
}

export const workerSocket = {
    init: (sandboxId: string): void => {
        const wsUrl = `ws://127.0.0.1:${process.env.AP_SANDBOX_WS_PORT ?? '12345'}`
        socket = io(wsUrl, buildSocketOptions(sandboxId))

        // Without this watchdog, if the parent worker is SIGKILLed (OOM, crash) before
        // the engine ever connects, the engine sits forever retrying the handshake on a
        // dead port — orphaned, idle, holding ~80 MB. The worker is the only thing that
        // can kill us, so if it's not there to talk to, we self-terminate.
        initialConnectWatchdog = setTimeout(() => {
            initialConnectWatchdog = undefined
            // eslint-disable-next-line no-console
            console.error('[engine] Failed to connect to worker within 60s, exiting')
            process.exit(5)
        }, INITIAL_CONNECT_TIMEOUT_MS)

        notifyClient = createNotifyClient<WorkerNotifyContract>(socket)
        rpcClient = createRpcClient<WorkerRpcContract>(socket, PIECE_REINSTALL_RPC_TIMEOUT_MS)

        socket.on('connect', () => {
            clearInitialConnectWatchdog()
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
            getMemoryUsage: async () => ({
                pieces: pieceMemorySampler.getLatestUsage(),
                heap: readHeapUsage(),
            }),
        })

        setInterval(() => {
            pieceMemorySampler.refreshUsage().catch(() => undefined)
        }, PIECES_MEMORY_REFRESH_INTERVAL_MS)

        socket.connect()
    },

    sendError: (error: unknown): void => {
        notifyClient?.stderr({ message: inspect(error) })
    },

    requestPieceReinstall: async (input: ForceReinstallPieceRequest): Promise<boolean> => {
        if (isNil(socket) || !socket.connected || isNil(rpcClient)) {
            return false
        }
        const client = rpcClient
        const { error } = await tryCatch(() => client.forceReinstallPiece(input))
        if (error) {
            notifyClient?.stderr({ message: `Piece reinstall request failed: ${inspect(error)}\n` })
            return false
        }
        return true
    },

    disconnect: (): void => {
        clearInitialConnectWatchdog()
        socket?.disconnect()
        socket = undefined
        notifyClient = undefined
    },
}

function readHeapUsage(): SandboxHeapUsage {
    const heap = getHeapStatistics()
    return {
        usedBytes: heap.used_heap_size,
        limitBytes: heap.heap_size_limit,
        externalBytes: heap.external_memory,
    }
}

function buildSocketOptions(sandboxId: string): Partial<ManagerOptions & SocketOptions> {
    const base: Partial<ManagerOptions & SocketOptions> = {
        path: '/worker/ws',
        // Connect straight over websocket to the localhost worker. The socket.io default starts with
        // HTTP long-polling then upgrades, adding ~75ms to a cold-fork handshake — pure waste for a
        // same-host control channel.
        transports: ['websocket'],
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
    return base
}
