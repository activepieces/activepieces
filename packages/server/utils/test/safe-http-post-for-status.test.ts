import http from 'node:http'
import { AddressInfo } from 'node:net'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { PostForStatusFailure, safeHttp } from '../src/safe-http'

const DEADLINE_MS = 300
const CHUNK = Buffer.alloc(64 * 1024, 'a')

describe('safeHttp.postForStatus', () => {
    const servers: TestServer[] = []

    beforeAll(() => {
        vi.stubEnv('AP_SSRF_ALLOW_LIST', '127.0.0.1')
    })

    afterEach(async () => {
        await Promise.all(servers.splice(0).map((server) => server.close()))
    })

    afterAll(() => {
        vi.unstubAllEnvs()
    })

    async function serve(handler: http.RequestListener): Promise<TestServer> {
        const server = await startServer(handler)
        servers.push(server)
        return server
    }

    it('sends the headers and the body and returns the status', async () => {
        const received: { headers: http.IncomingHttpHeaders, body: string }[] = []
        const server = await serve((req, res) => {
            const chunks: Buffer[] = []
            req.on('data', (chunk: Buffer) => chunks.push(chunk))
            req.on('end', () => {
                received.push({ headers: req.headers, body: Buffer.concat(chunks).toString() })
                res.writeHead(202).end('accepted')
            })
        })

        const result = await safeHttp.postForStatus({
            url: server.url,
            headers: { 'Content-Type': 'application/json', 'X-Api-Key': 'secret' },
            body: { action: 'flow.created' },
            timeoutMs: DEADLINE_MS,
        })

        expect(result).toEqual({ responded: true, status: 202 })
        expect(received[0].headers['x-api-key']).toBe('secret')
        expect(JSON.parse(received[0].body)).toEqual({ action: 'flow.created' })
    })

    it('stops reading a response body that never ends', async () => {
        const server = await serve((_req, res) => {
            res.writeHead(200)
            writeUntilClosed(res)
        })

        const startedAt = Date.now()
        const result = await safeHttp.postForStatus({ url: server.url, headers: {}, body: {}, timeoutMs: 5000 })

        expect(result).toEqual({ responded: true, status: 200 })
        expect(Date.now() - startedAt).toBeLessThan(2000)
        await expect(server.closedResponses()).resolves.toBeGreaterThanOrEqual(1)
    })

    it('returns the status when the compressed response body is broken', async () => {
        const server = await serve((_req, res) => {
            res.writeHead(200, { 'Content-Encoding': 'gzip' }).end('this is not gzip')
        })

        const result = await safeHttp.postForStatus({ url: server.url, headers: {}, body: {}, timeoutMs: DEADLINE_MS })

        expect(result).toEqual({ responded: true, status: 200 })
    })

    it('returns the status by the deadline when the body arrives one byte at a time', async () => {
        const server = await serve((_req, res) => {
            res.writeHead(200)
            const interval = setInterval(() => res.write('a'), 20)
            res.on('close', () => clearInterval(interval))
        })

        const startedAt = Date.now()
        const result = await safeHttp.postForStatus({ url: server.url, headers: {}, body: {}, timeoutMs: DEADLINE_MS })

        expect(result).toEqual({ responded: true, status: 200 })
        expect(Date.now() - startedAt).toBeLessThan(DEADLINE_MS + 1000)
    })

    it('reports a timeout when the destination never answers', async () => {
        const server = await serve(() => undefined)

        const result = await safeHttp.postForStatus({ url: server.url, headers: {}, body: {}, timeoutMs: DEADLINE_MS })

        expect(result).toMatchObject({ responded: false, failure: PostForStatusFailure.TIMEOUT })
    })

    it('reuses the connection for the next request', async () => {
        const server = await serve((_req, res) => {
            res.writeHead(200).end('ok')
        })

        await safeHttp.postForStatus({ url: server.url, headers: {}, body: {}, timeoutMs: DEADLINE_MS })
        await safeHttp.postForStatus({ url: server.url, headers: {}, body: {}, timeoutMs: DEADLINE_MS })

        expect(server.connections()).toBe(1)
    })

    it('reports a refused connection', async () => {
        const server = await startServer(() => undefined)
        await server.close()

        const result = await safeHttp.postForStatus({ url: server.url, headers: {}, body: {}, timeoutMs: DEADLINE_MS })

        expect(result).toMatchObject({ responded: false, failure: PostForStatusFailure.CONNECTION_FAILED })
    })

    it('reports a TLS failure', async () => {
        const server = await serve((_req, res) => {
            res.writeHead(200).end('ok')
        })

        const result = await safeHttp.postForStatus({ url: server.url.replace('http://', 'https://'), headers: {}, body: {}, timeoutMs: DEADLINE_MS })

        expect(result).toMatchObject({ responded: false, failure: PostForStatusFailure.TLS })
    })

    it('reports a blocked address', async () => {
        const result = await safeHttp.postForStatus({ url: 'http://10.0.0.1/', headers: {}, body: {}, timeoutMs: DEADLINE_MS })

        expect(result).toMatchObject({ responded: false, failure: PostForStatusFailure.BLOCKED })
    })
})

function writeUntilClosed(res: http.ServerResponse): void {
    if (res.destroyed) {
        return
    }
    if (res.write(CHUNK)) {
        setImmediate(() => writeUntilClosed(res))
        return
    }
    res.once('drain', () => writeUntilClosed(res))
}

function startServer(handler: http.RequestListener): Promise<TestServer> {
    const server = http.createServer(handler)
    let connectionCount = 0
    let closedResponseCount = 0
    server.on('connection', () => {
        connectionCount += 1
    })
    server.on('request', (_req, res) => {
        res.on('close', () => {
            closedResponseCount += 1
        })
    })
    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
            resolve({
                url: `http://127.0.0.1:${portOf(server.address())}/`,
                connections: () => connectionCount,
                closedResponses: () => waitFor(() => closedResponseCount),
                close: () => new Promise((resolveClose) => {
                    server.closeAllConnections()
                    server.close(() => resolveClose())
                }),
            })
        })
    })
}

function portOf(address: string | AddressInfo | null): number {
    if (address === null || typeof address === 'string') {
        throw new Error('The test server has no TCP port')
    }
    return address.port
}

async function waitFor(read: () => number): Promise<number> {
    for (let attempt = 0; attempt < 50 && read() === 0; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 20))
    }
    return read()
}

type TestServer = {
    url: string
    connections: () => number
    closedResponses: () => Promise<number>
    close: () => Promise<void>
}
