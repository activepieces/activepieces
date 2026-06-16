import { timingSafeEqual } from 'node:crypto'
import http from 'node:http'
import { EngineOperation, EngineOperationType, EngineResponse, ERROR_MESSAGES_TO_REDACT, maxSocketHttpBufferSizeBytes } from '@activepieces/shared'
import { flowRunProgressReporter } from './helper/flow-run-progress-reporter'
import { execute } from './operations'

const BIND_RETRY_DELAY_MS = 200
const BIND_RETRY_TIMEOUT_MS = 30_000
const GC_INTERVAL_MS = 60_000

// One-at-a-time per engine process: the worker serializes /execute calls per sandbox, so a
// single module-level buffer captures exactly the in-flight operation's stdout/stderr and is
// returned in its response body (the worker cannot read a remote function's native pipes).
let activeLogBuffer: string[] | null = null
let server: http.Server | undefined

export const engineServer = {
    start: async (): Promise<void> => {
        const port = Number(process.env.AP_ENGINE_PORT)
        // Loopback by default so the worker-pool sandbox engine is only reachable by its local
        // worker. A remote function (Cloud Run) must listen on 0.0.0.0 — set AP_ENGINE_HOST.
        const host = process.env.AP_ENGINE_HOST ?? '127.0.0.1'

        server = http.createServer(engineServer.createRequestListener())

        await listenWithRetry(server, port, host)
    },
    // The same request handler powers the standalone server and a Cloud Functions gen2
    // functions-framework entry point (which provides its own HTTP server). gen2 buffers the
    // body into req.rawBody, so handleRequest reads that when present.
    createRequestListener: (): http.RequestListener => {
        installConsoleCapture()
        installPeriodicGc()
        const token = process.env.AP_ENGINE_TOKEN
        const maxBodyBytes = maxSocketHttpBufferSizeBytes(Number(process.env.AP_MAX_FILE_SIZE_MB ?? '100'))
        return (req, res) => {
            void handleRequest({ req, res, token, maxBodyBytes })
        }
    },
    stop: async (): Promise<void> => {
        if (server) {
            await new Promise<void>((resolve) => server!.close(() => resolve()))
            server = undefined
        }
    },
}

async function handleRequest({ req, res, token, maxBodyBytes }: HandleRequestParams): Promise<void> {
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200).end('ok')
        return
    }
    if (req.method !== 'POST' || req.url !== '/execute') {
        res.writeHead(404).end()
        return
    }
    if (!isAuthorized(req, token)) {
        res.writeHead(401).end()
        return
    }

    activeLogBuffer = []
    flowRunProgressReporter.init()
    try {
        const body = await readBody(req, maxBodyBytes)
        const { operationType, operation } = JSON.parse(body.toString('utf-8')) as ExecuteRequestBody
        const engineResponse = await execute(operationType, operation)
        await flowRunProgressReporter.shutdown()
        const logs = activeLogBuffer.join('')
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ engineResponse, logs }))
    }
    catch (error) {
        await flowRunProgressReporter.shutdown()
        const logs = activeLogBuffer?.join('') ?? ''
        // eslint-disable-next-line no-console
        console.error('[engine] Failed to handle execute request', error)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: String(error), logs }))
    }
    finally {
        activeLogBuffer = null
    }
}

function isAuthorized(req: http.IncomingMessage, token: string | undefined): boolean {
    const header = req.headers.authorization
    if (typeof header !== 'string' || !header.startsWith('Bearer ') || token === undefined) {
        return false
    }
    const provided = Buffer.from(header.slice('Bearer '.length))
    const expected = Buffer.from(token)
    return provided.length === expected.length && timingSafeEqual(provided, expected)
}

function readBody(req: http.IncomingMessage, maxBytes: number): Promise<Buffer> {
    // Cloud Functions gen2 (functions-framework) consumes the request stream and exposes the
    // raw bytes here, so prefer it when present instead of re-reading an empty stream.
    const rawBody = (req as http.IncomingMessage & { rawBody?: Buffer }).rawBody
    if (rawBody) {
        return Promise.resolve(rawBody)
    }
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = []
        let size = 0
        req.on('data', (chunk: Buffer) => {
            size += chunk.length
            if (size > maxBytes) {
                reject(new Error(`Request body exceeds the maximum allowed size of ${maxBytes} bytes`))
                req.destroy()
                return
            }
            chunks.push(chunk)
        })
        req.on('end', () => resolve(Buffer.concat(chunks)))
        req.on('error', reject)
    })
}

// A fresh engine reuses its slot's deterministic loopback port. When a non-reusable sandbox is
// recycled, the previous engine may still hold the port for a moment while the worker treeKills
// it, so we retry the bind until it frees up instead of crashing the new engine.
function listenWithRetry(httpServer: http.Server, port: number, host: string): Promise<void> {
    const deadline = Date.now() + BIND_RETRY_TIMEOUT_MS
    return new Promise<void>((resolve, reject) => {
        const attempt = (): void => {
            const onError = (error: NodeJS.ErrnoException): void => {
                if (error.code === 'EADDRINUSE' && Date.now() < deadline) {
                    setTimeout(attempt, BIND_RETRY_DELAY_MS)
                    return
                }
                reject(error)
            }
            httpServer.once('error', onError)
            httpServer.listen(port, host, () => {
                httpServer.removeListener('error', onError)
                resolve()
            })
        }
        attempt()
    })
}

function installConsoleCapture(): void {
    const originalLog = console.log
    console.log = function (...args): void {
        appendLog(args.join(' ') + '\n')
        originalLog.apply(console, args)
    }

    const originalWarn = console.warn
    console.warn = function (...args): void {
        appendLog(args.join(' ') + '\n')
        originalWarn.apply(console, args)
    }

    const originalError = console.error
    console.error = function (...args): void {
        let sanitizedArgs = [...args]
        if (typeof args[0] === 'string' && ERROR_MESSAGES_TO_REDACT.some(m => args[0].includes(m))) {
            sanitizedArgs = [sanitizedArgs[0], 'REDACTED']
        }
        appendLog(sanitizedArgs.join(' ') + '\n')
        originalError.apply(console, sanitizedArgs)
    }
}

function appendLog(message: string): void {
    if (activeLogBuffer) {
        activeLogBuffer.push(message)
    }
}

function installPeriodicGc(): void {
    const gc = global.gc
    if (typeof gc === 'function') {
        setInterval(() => {
            gc()
        }, GC_INTERVAL_MS)
    }
}

type HandleRequestParams = {
    req: http.IncomingMessage
    res: http.ServerResponse
    token: string | undefined
    maxBodyBytes: number
}

type ExecuteRequestBody = {
    operationType: EngineOperationType
    operation: EngineOperation
}

export type EngineExecuteResponse = {
    engineResponse: EngineResponse<unknown>
    logs: string
}
