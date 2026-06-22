import { timingSafeEqual } from 'node:crypto'
import http from 'node:http'
import { inspect } from 'node:util'
import {
    EngineOperation,
    EngineOperationType,
    EngineResponse,
    ERROR_MESSAGES_TO_REDACT,
    WorkerContract,
} from '@activepieces/shared'
import { flowRunProgressReporter } from './helper/flow-run-progress-reporter'
import { execute } from './operations'

const INITIAL_CONNECT_TIMEOUT_MS = 60_000
const PARENT_WATCHDOG_INTERVAL_MS = 5_000

let server: http.Server | undefined
let activeStream: http.ServerResponse | undefined
let workerClient: WorkerContract | undefined
let initialConnectWatchdog: NodeJS.Timeout | undefined
let parentWatchdog: NodeJS.Timeout | undefined
let restoreConsole: (() => void) | undefined

function clearInitialConnectWatchdog(): void {
    if (initialConnectWatchdog) {
        clearTimeout(initialConnectWatchdog)
        initialConnectWatchdog = undefined
    }
}

// One execute at a time per sandbox (the worker serializes via its busy flag), so a
// single module-level stream is enough. WorkerContract calls and console output are
// written onto whichever /execute response is currently open.
function writeEvent(event: { t: 'notify' | 'rpc' | 'result' | 'error', method?: string, payload?: unknown, message?: string }): void {
    activeStream?.write(`data: ${JSON.stringify(event)}\n\n`)
}

function isAuthorized(req: http.IncomingMessage): boolean {
    const expected = process.env.AP_SANDBOX_WS_TOKEN
    const provided = req.headers['x-connection-token']
    if (typeof provided !== 'string' || typeof expected !== 'string') {
        return false
    }
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
}

async function handleExecute(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    clearInitialConnectWatchdog()

    let body = ''
    for await (const chunk of req) {
        body += chunk
    }
    const { operationType, operation } = JSON.parse(body) as { operationType: EngineOperationType, operation: EngineOperation }

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    })
    activeStream = res

    // If the worker drops the connection mid-flight, it's gone — same rationale as the
    // socket transport's disconnect handler: this engine can never be re-driven.
    res.on('close', () => {
        if (activeStream === res && !res.writableEnded) {
            // eslint-disable-next-line no-console
            console.error('[engine] Worker dropped the execute stream, exiting')
            process.exit(6)
        }
    })

    try {
        let response: EngineResponse<unknown>
        flowRunProgressReporter.init()
        try {
            response = await execute(operationType, operation)
        }
        finally {
            // Flush progress / uploadRunLog frames before the result frame, mirroring the
            // socket transport where shutdown() ran before the RPC ack was sent.
            await flowRunProgressReporter.shutdown()
        }
        writeEvent({ t: 'result', payload: JSON.parse(JSON.stringify(response)) })
    }
    catch (error) {
        writeEvent({ t: 'error', message: inspect(error) })
    }
    finally {
        activeStream = undefined
        res.end()
    }
}

export const workerHttp = {
    init: (_sandboxId: string): void => {
        const port = Number(process.env.AP_SANDBOX_WS_PORT ?? '12345')

        initialConnectWatchdog = setTimeout(() => {
            initialConnectWatchdog = undefined
            // eslint-disable-next-line no-console
            console.error('[engine] Worker never connected within 60s, exiting')
            process.exit(5)
        }, INITIAL_CONNECT_TIMEOUT_MS)

        // HTTP has no persistent connection between operations, so a dropped stream only
        // catches the worker dying mid-execute. Poll the parent pid to also catch an idle
        // engine being orphaned (parent OOM/crash) — on reparent ppid becomes 1.
        parentWatchdog = setInterval(() => {
            if (process.ppid === 1) {
                // eslint-disable-next-line no-console
                console.error('[engine] Parent worker gone (reparented to init), exiting')
                process.exit(6)
            }
        }, PARENT_WATCHDOG_INTERVAL_MS)

        workerClient = new Proxy({} as WorkerContract, {
            get(_target, method: string) {
                return async (payload: unknown): Promise<void> => {
                    writeEvent({ t: 'rpc', method, payload })
                }
            },
        })

        const originalLog = console.log
        const originalWarn = console.warn
        const originalError = console.error
        console.log = function (...args): void {
            writeEvent({ t: 'notify', method: 'stdout', payload: { message: args.join(' ') + '\n' } })
            originalLog.apply(console, args)
        }
        console.warn = function (...args): void {
            writeEvent({ t: 'notify', method: 'stdout', payload: { message: args.join(' ') + '\n' } })
            originalWarn.apply(console, args)
        }
        console.error = function (...args): void {
            let sanitizedArgs = [...args]
            if (typeof args[0] === 'string' && ERROR_MESSAGES_TO_REDACT.some(m => args[0].includes(m))) {
                sanitizedArgs = [sanitizedArgs[0], 'REDACTED']
            }
            writeEvent({ t: 'notify', method: 'stderr', payload: { message: sanitizedArgs.join(' ') + '\n' } })
            originalError.apply(console, sanitizedArgs)
        }
        restoreConsole = () => {
            console.log = originalLog
            console.warn = originalWarn
            console.error = originalError
        }

        server = http.createServer((req, res) => {
            if (req.method !== 'POST' || req.url !== '/execute') {
                res.writeHead(404)
                res.end()
                return
            }
            if (!isAuthorized(req)) {
                res.writeHead(401)
                res.end()
                return
            }
            if (activeStream) {
                res.writeHead(409)
                res.end()
                return
            }
            handleExecute(req, res).catch((error) => {
                writeEvent({ t: 'error', message: inspect(error) })
                activeStream = undefined
                res.end()
            })
        })

        server.listen(port, '127.0.0.1')

        const gc = global.gc
        if (typeof gc === 'function') {
            const GC_INTERVAL_MS = 60_000
            setInterval(() => {
                gc()
            }, GC_INTERVAL_MS)
        }
    },

    getWorkerClient: (): WorkerContract => {
        if (!workerClient) throw new Error('Worker client not initialized')
        return workerClient
    },

    sendError: (error: unknown): void => {
        writeEvent({ t: 'notify', method: 'stderr', payload: { message: inspect(error) } })
    },

    disconnect: (): void => {
        clearInitialConnectWatchdog()
        if (parentWatchdog) {
            clearInterval(parentWatchdog)
            parentWatchdog = undefined
        }
        restoreConsole?.()
        restoreConsole = undefined
        server?.close()
        server = undefined
        activeStream = undefined
        workerClient = undefined
    },
}
