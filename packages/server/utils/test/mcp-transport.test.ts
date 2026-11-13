import http, { IncomingHttpHeaders } from 'node:http'
import { AddressInfo } from 'node:net'
import { McpAuthType, McpProtocol } from '@activepieces/shared'
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { mcpTransport } from '../src/mcp-transport'

let origin: TestServer
let otherOrigin: TestServer
const openTransports: Transport[] = []

beforeAll(async () => {
    vi.stubEnv('AP_SSRF_ALLOW_LIST', '127.0.0.1')
    origin = await startServer({
        handler: (req, res, baseUrl) => {
            const redirect = parseRedirect(req.url ?? '')
            if (redirect !== null) {
                const location = redirect.target === 'same' ? `${baseUrl}/mcp` : `${otherOrigin.url}/mcp`
                res.writeHead(redirect.status, { Location: location }).end()
                return
            }
            res.writeHead(req.url === '/no-content' ? 204 : 202).end()
        },
    })
    otherOrigin = await startServer({
        handler: (_req, res) => {
            res.writeHead(202).end()
        },
    })
})

afterEach(async () => {
    await Promise.all(openTransports.splice(0).map((transport) => transport.close()))
    origin.requests.length = 0
    otherOrigin.requests.length = 0
})

afterAll(async () => {
    await Promise.all([origin.close(), otherOrigin.close()])
    vi.unstubAllEnvs()
})

describe('mcpTransport.createTransport redirects', () => {
    it('sends the configured auth header to the server it was pointed at', async () => {
        const transport = createTransport({ path: '/mcp', protocol: McpProtocol.STREAMABLE_HTTP })

        await transport.send(INITIALIZED_NOTIFICATION)

        const posts = postsTo(origin)
        expect(posts).toHaveLength(1)
        expect(posts[0].headers[API_KEY_HEADER]).toBe(API_KEY)
    })

    it.each([301, 302, 303, 307, 308])('does not follow a %i redirect to another origin', async (status) => {
        const transport = createTransport({ path: `/redirect/other/${status}`, protocol: McpProtocol.STREAMABLE_HTTP })

        await expect(transport.send(INITIALIZED_NOTIFICATION)).rejects.toThrow()

        expect(otherOrigin.requests).toHaveLength(0)
    })

    it('follows a redirect within the same origin and keeps the auth header', async () => {
        const transport = createTransport({ path: '/redirect/same/307', protocol: McpProtocol.STREAMABLE_HTTP })

        await transport.send(INITIALIZED_NOTIFICATION)

        const posts = postsTo(origin)
        expect(posts.map((request) => request.url)).toEqual(['/redirect/same/307', '/mcp'])
        expect(posts[1].headers[API_KEY_HEADER]).toBe(API_KEY)
        expect(otherOrigin.requests).toHaveLength(0)
    })

    it.each([301, 302, 303, 307, 308])('does not follow a %i redirect to another origin when opening an SSE stream', async (status) => {
        const transport = createTransport({ path: `/redirect/other/${status}`, protocol: McpProtocol.SSE })

        await expect(transport.start()).rejects.toThrow()

        expect(origin.requests.some((request) => request.method === 'GET' && request.url === `/redirect/other/${status}`)).toBe(true)
        expect(otherOrigin.requests).toHaveLength(0)
    })
})

describe('mcpTransport.createTransport responses', () => {
    it('accepts a 204 reply that carries no body', async () => {
        const transport = createTransport({ path: '/no-content', protocol: McpProtocol.STREAMABLE_HTTP })

        await expect(transport.send(INITIALIZED_NOTIFICATION)).resolves.toBeUndefined()
    })
})

function createTransport({ path, protocol }: { path: string, protocol: McpProtocol }): Transport {
    const transport = mcpTransport.createTransport({
        protocol,
        serverUrl: `${origin.url}${path}`,
        auth: { type: McpAuthType.API_KEY, apiKeyHeader: API_KEY_HEADER, apiKey: API_KEY },
        timeoutMs: 5_000,
    })
    openTransports.push(transport)
    return transport
}

function postsTo(server: TestServer): RecordedRequest[] {
    return server.requests.filter((request) => request.method === 'POST')
}

function parseRedirect(url: string): Redirect | null {
    const match = /^\/redirect\/(same|other)\/(\d{3})$/.exec(url)
    if (match === null) {
        return null
    }
    return { target: match[1] === 'same' ? 'same' : 'other', status: Number(match[2]) }
}

async function startServer({ handler }: { handler: (req: http.IncomingMessage, res: http.ServerResponse, baseUrl: string) => void }): Promise<TestServer> {
    const requests: RecordedRequest[] = []
    const server = http.createServer((req, res) => {
        req.resume()
        req.on('end', () => {
            requests.push({ url: req.url ?? '', method: req.method ?? '', headers: req.headers })
            handler(req, res, url)
        })
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const url = `http://127.0.0.1:${listeningPort(server.address())}`
    return {
        url,
        requests,
        close: () => new Promise<void>((resolve) => {
            server.closeAllConnections()
            server.close(() => resolve())
        }),
    }
}

function listeningPort(address: string | AddressInfo | null): number {
    if (address === null || typeof address === 'string') {
        throw new Error('test server is not listening on a TCP port')
    }
    return address.port
}

const API_KEY_HEADER = 'x-api-key'
const API_KEY = 'secret-key'
const INITIALIZED_NOTIFICATION = { jsonrpc: '2.0' as const, method: 'notifications/initialized' }

type Redirect = { target: 'same' | 'other', status: number }
type RecordedRequest = { url: string, method: string, headers: IncomingHttpHeaders }
type TestServer = { url: string, requests: RecordedRequest[], close: () => Promise<void> }
