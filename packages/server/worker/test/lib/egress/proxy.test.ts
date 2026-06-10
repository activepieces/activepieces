import dns from 'node:dns/promises'
import http from 'node:http'
import { AddressInfo, createServer, Server } from 'node:net'
import pino from 'pino'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EgressProxy, startEgressProxy } from '../../../src/lib/egress/proxy'

const log = pino({ level: 'silent' })

type AnyServer = http.Server | Server

async function startHttpEcho(): Promise<{ server: http.Server, port: number }> {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain', 'x-echo-url': req.url ?? '' })
        res.end('echo-body')
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    const port = (server.address() as AddressInfo).port
    return { server, port }
}

async function closeServer(s: AnyServer): Promise<void> {
    return new Promise<void>((resolve) => s.close(() => resolve()))
}

function fetchThroughProxy({ proxyPort, targetUrl, host }: {
    proxyPort: number
    targetUrl: string
    host: string
}): Promise<{ statusCode: number, body: string, headers: http.IncomingHttpHeaders }> {
    return new Promise((resolve, reject) => {
        const req = http.request({
            host: '127.0.0.1',
            port: proxyPort,
            method: 'GET',
            path: targetUrl,
            headers: { host },
        }, (res) => {
            const chunks: Buffer[] = []
            res.on('data', (c) => chunks.push(c))
            res.on('end', () => resolve({
                statusCode: res.statusCode ?? 0,
                body: Buffer.concat(chunks).toString('utf8'),
                headers: res.headers,
            }))
        })
        req.on('error', reject)
        req.end()
    })
}

function connectThroughProxy({ proxyPort, target }: { proxyPort: number, target: string }): Promise<{ status: number, raw: string }> {
    return new Promise((resolve, reject) => {
        const req = http.request({
            host: '127.0.0.1',
            port: proxyPort,
            method: 'CONNECT',
            path: target,
        })
        req.on('connect', (res, socket) => {
            socket.destroy()
            resolve({ status: res.statusCode ?? 0, raw: '' })
        })
        req.on('response', (res) => {
            const chunks: Buffer[] = []
            res.on('data', (c) => chunks.push(c))
            res.on('end', () => resolve({
                status: res.statusCode ?? 0,
                raw: Buffer.concat(chunks).toString('utf8'),
            }))
        })
        req.on('error', reject)
        req.end()
    })
}

describe('egress-proxy', () => {
    let proxy: EgressProxy

    afterEach(async () => {
        if (proxy) {
            await proxy.close()
        }
    })

    describe('HTTP forward', () => {
        it('forwards to allowed public-style host (via 127.0.0.1 in allowList)', async () => {
            const { server, port } = await startHttpEcho()
            try {
                proxy = await startEgressProxy({ log, allowList: ['127.0.0.1'] })
                const res = await fetchThroughProxy({
                    proxyPort: proxy.port,
                    targetUrl: `http://127.0.0.1:${port}/hello`,
                    host: `127.0.0.1:${port}`,
                })
                expect(res.statusCode).toBe(200)
                expect(res.body).toBe('echo-body')
                expect(res.headers['x-echo-url']).toBe('/hello')
            }
            finally {
                await closeServer(server)
            }
        })

        it('refuses HTTP forward to private IP (no allowList)', async () => {
            proxy = await startEgressProxy({ log, allowList: [] })
            const res = await fetchThroughProxy({
                proxyPort: proxy.port,
                targetUrl: 'http://169.254.169.254/latest/meta-data/',
                host: '169.254.169.254',
            })
            expect(res.statusCode).toBe(403)
            expect(res.body).toContain('Egress blocked')
        })

        it('refuses HTTP forward to loopback without allowList', async () => {
            proxy = await startEgressProxy({ log, allowList: [] })
            const res = await fetchThroughProxy({
                proxyPort: proxy.port,
                targetUrl: 'http://127.0.0.1:9999/',
                host: '127.0.0.1:9999',
            })
            expect(res.statusCode).toBe(403)
        })

        it('rejects non-http urls (e.g. https forward)', async () => {
            proxy = await startEgressProxy({ log, allowList: [] })
            const res = await fetchThroughProxy({
                proxyPort: proxy.port,
                targetUrl: 'https://example.com/',
                host: 'example.com',
            })
            expect(res.statusCode).toBe(400)
        })
    })

    describe('multi-A-record hostnames', () => {
        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('rejects hostname when any resolved IP is private (public + private A records)', async () => {
            vi.spyOn(dns, 'lookup').mockResolvedValue([
                { address: '8.8.8.8', family: 4 },
                { address: '10.0.0.5', family: 4 },
            ] as unknown as dns.LookupAddress)
            proxy = await startEgressProxy({ log, allowList: [] })
            const res = await fetchThroughProxy({
                proxyPort: proxy.port,
                targetUrl: 'http://multi.example.test/',
                host: 'multi.example.test',
            })
            expect(res.statusCode).toBe(403)
            expect(res.body).toContain('Egress blocked')
        })

        it('rejects hostname when the ONLY non-first resolved IP is private (proves we check every A record)', async () => {
            vi.spyOn(dns, 'lookup').mockResolvedValue([
                { address: '8.8.8.8', family: 4 },
                { address: '8.8.4.4', family: 4 },
                { address: '192.168.1.1', family: 4 },
            ] as unknown as dns.LookupAddress)
            proxy = await startEgressProxy({ log, allowList: [] })
            const res = await fetchThroughProxy({
                proxyPort: proxy.port,
                targetUrl: 'http://rebind.example.test/',
                host: 'rebind.example.test',
            })
            expect(res.statusCode).toBe(403)
            expect(res.body).toContain('Egress blocked')
        })
    })

    describe('HTTPS CONNECT', () => {
        it('refuses CONNECT to private IP', async () => {
            proxy = await startEgressProxy({ log, allowList: [] })
            const res = await connectThroughProxy({
                proxyPort: proxy.port,
                target: '169.254.169.254:443',
            })
            expect(res.status).toBe(403)
        })

        it('refuses CONNECT when port is malformed', async () => {
            proxy = await startEgressProxy({ log, allowList: [] })
            const res = await connectThroughProxy({
                proxyPort: proxy.port,
                target: 'example.com:abc',
            })
            expect(res.status).toBe(400)
        })

        it('allows CONNECT when target IP is in allowList', async () => {
            const tcpServer = createServer((s) => s.destroy())
            await new Promise<void>((r) => tcpServer.listen(0, '127.0.0.1', () => r()))
            const tcpPort = (tcpServer.address() as AddressInfo).port
            try {
                proxy = await startEgressProxy({ log, allowList: ['127.0.0.1'] })
                const res = await connectThroughProxy({
                    proxyPort: proxy.port,
                    target: `127.0.0.1:${tcpPort}`,
                })
                expect(res.status).toBe(200)
            }
            finally {
                await closeServer(tcpServer)
            }
        })
    })
})
