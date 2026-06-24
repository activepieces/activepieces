import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { ActivepiecesError, isNil, tryCatch } from '@activepieces/core-utils'
import { apLogger } from '@activepieces/server-utils'
import { createSandboxPool } from '../lib/local-pool-runtime'
import { ExecuteRequest, ExecuteResponse, SandboxPoolSettings } from '../lib/types'

// The Pool Server: the GCP_CLOUD_RUN host. It is the same sandbox pool at concurrency 1, fronted by
// a single POST /execute. The body is self-contained (settings travel per request) so the container
// needs no app connection; pieces are pulled over HTTP from publicApiUrl. See ADR 0003.

const log = apLogger.create()
const PORT = Number(process.env['PORT'] ?? process.env['AP_POOL_SERVER_PORT'] ?? 8080)
const TOKEN = process.env['AP_POOL_SERVER_TOKEN']
const BASE_PATH = process.env['AP_CACHE_BASE_PATH'] ?? 'cache'
const MAX_BODY_BYTES = 100 * 1024 * 1024

// Concurrency is pinned to 1, so a single request-scoped stash is safe — getSettings() always reads
// the settings of the in-flight /execute call.
let currentSettings: SandboxPoolSettings | undefined

const pool = createSandboxPool({
    concurrency: 1,
    basePath: BASE_PATH,
    getSettings: () => {
        if (isNil(currentSettings)) {
            throw new Error('Pool Server: getSettings called with no in-flight request settings')
        }
        return currentSettings
    },
    log,
})

const server = createServer((req, res) => {
    void route(req, res)
})

server.listen(PORT, () => {
    log.info({ port: PORT, basePath: BASE_PATH }, 'Pool Server listening')
})

async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method === 'GET' && req.url === '/health') {
        return sendJson(res, 200, { status: 'ok' })
    }
    if (req.method === 'POST' && req.url === '/execute') {
        if (isNil(TOKEN) || req.headers.authorization !== `Bearer ${TOKEN}`) {
            return sendJson(res, 401, { message: 'unauthorized' })
        }
        const { data: body, error: parseError } = await tryCatch(() => readBody(req))
        if (parseError) {
            return sendJson(res, 400, { message: String(parseError) })
        }
        const response = await execute(body)
        return sendJson(res, 200, response)
    }
    return sendJson(res, 404, { message: 'not found' })
}

async function execute(body: ExecuteRequest): Promise<ExecuteResponse> {
    currentSettings = body.settings
    const outcome = await tryCatch(() => pool.execute({
        workerIndex: 0,
        log,
        operationType: body.operationType,
        operation: body.operation,
        timeoutInSeconds: body.timeoutInSeconds,
        provision: body.provision,
    }))
    if (outcome.error === null) {
        return { ok: true, result: outcome.data }
    }
    if (outcome.error instanceof ActivepiecesError) {
        return { ok: false, errorCode: outcome.error.error.code, params: outcome.error.error.params }
    }
    log.error({ error: String(outcome.error) }, 'Pool Server: execute failed with a non-ActivepiecesError')
    return { ok: false, errorCode: 'POOL_SERVER_ERROR', params: { message: String(outcome.error) } }
}

function readBody(req: IncomingMessage): Promise<ExecuteRequest> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        let size = 0
        req.on('data', (chunk: Buffer) => {
            size += chunk.length
            if (size > MAX_BODY_BYTES) {
                reject(new Error('request body too large'))
                req.destroy()
                return
            }
            chunks.push(chunk)
        })
        req.on('end', () => {
            const parsed = tryCatchSyncParse(Buffer.concat(chunks).toString('utf8'))
            if (parsed === undefined) {
                reject(new Error('invalid JSON body'))
                return
            }
            resolve(parsed)
        })
        req.on('error', reject)
    })
}

function tryCatchSyncParse(raw: string): ExecuteRequest | undefined {
    try {
        return JSON.parse(raw)
    }
    catch {
        return undefined
    }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
    const payload = JSON.stringify(body)
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(payload)
}
