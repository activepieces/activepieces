import dns from 'node:dns/promises'
import http, { IncomingMessage, ServerResponse } from 'node:http'
import net from 'node:net'
import { Duplex } from 'node:stream'
import { ssrfIpClassifier } from '@activepieces/shared'
import { Logger } from 'pino'

export async function startEgressProxy({ log, allowList }: StartOptions): Promise<EgressProxy> {
    const server = http.createServer()

    server.on('request', (req, res) => {
        void handleHttpForward({ req, res, allowList, log }).catch((err) => {
            log.warn({ err, url: req.url }, 'Egress proxy HTTP forward failed')
            if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'text/plain' })
            }
            res.end('Egress proxy error')
        })
    })

    server.on('connect', (req, clientSocket, head) => {
        void handleConnect({ req, clientSocket, head, allowList, log }).catch((err) => {
            log.warn({ err, url: req.url }, 'Egress proxy CONNECT failed')
            writeConnectError(clientSocket, '502 Bad Gateway')
        })
    })

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    const port = (server.address() as net.AddressInfo).port
    log.info({ port }, 'Egress proxy listening on loopback')

    return {
        port,
        close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    }
}

async function resolveOrRefuse({ hostname, allowList }: { hostname: string, allowList: string[] }): Promise<string> {
    if (net.isIP(hostname) > 0) {
        if (ssrfIpClassifier.isBlockedIp({ ip: hostname, allowList })) {
            throw new BlockedHostError(hostname, hostname)
        }
        return hostname
    }
    const { address } = await dns.lookup(hostname)
    if (ssrfIpClassifier.isBlockedIp({ ip: address, allowList })) {
        throw new BlockedHostError(hostname, address)
    }
    return address
}

async function handleHttpForward({ req, res, allowList, log }: HttpForwardArgs): Promise<void> {
    const target = parseForwardUrl(req.url ?? '')
    if (!target) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Bad request')
        return
    }
    const resolvedIp = await resolveOrRefuse({ hostname: target.hostname, allowList }).catch((err) => {
        if (err instanceof BlockedHostError) {
            log.warn({ host: err.host, ip: err.ip }, 'Egress proxy refused HTTP forward')
            res.writeHead(403, { 'Content-Type': 'text/plain' })
            res.end(`Egress blocked: ${err.host}`)
            return null
        }
        throw err
    })
    if (resolvedIp === null) return

    const outboundHeaders = stripProxyHeaders(req.headers)
    outboundHeaders['host'] = target.hostHeader

    const outbound = http.request({
        host: resolvedIp,
        port: target.port,
        method: req.method,
        path: target.pathAndQuery,
        headers: outboundHeaders,
        setHost: false,
    })
    outbound.on('response', (upstream) => {
        res.writeHead(upstream.statusCode ?? 502, upstream.headers)
        upstream.pipe(res)
    })
    outbound.on('error', (err) => {
        log.warn({ err }, 'Outbound HTTP request error')
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain' })
        }
        res.end()
    })
    req.pipe(outbound)
}

async function handleConnect({ req, clientSocket, head, allowList, log }: ConnectArgs): Promise<void> {
    const target = parseConnectTarget(req.url ?? '')
    if (!target) {
        writeConnectError(clientSocket, '400 Bad Request')
        return
    }
    const resolvedIp = await resolveOrRefuse({ hostname: target.hostname, allowList }).catch((err) => {
        if (err instanceof BlockedHostError) {
            log.warn({ host: err.host, ip: err.ip }, 'Egress proxy refused CONNECT')
            writeConnectError(clientSocket, '403 Forbidden')
            return null
        }
        throw err
    })
    if (resolvedIp === null) return

    const upstream = net.connect(target.port, resolvedIp, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        if (head.length > 0) upstream.write(head)
        upstream.pipe(clientSocket)
        clientSocket.pipe(upstream)
    })
    upstream.on('error', (err) => {
        log.warn({ err }, 'Upstream CONNECT error')
        writeConnectError(clientSocket, '502 Bad Gateway')
    })
    clientSocket.on('error', () => upstream.destroy())
}

function parseForwardUrl(raw: string): ForwardTarget | undefined {
    try {
        const url = new URL(raw)
        if (url.protocol !== 'http:') return undefined
        const port = url.port ? parseInt(url.port, 10) : 80
        return {
            hostname: url.hostname,
            port,
            hostHeader: url.port ? `${url.hostname}:${port}` : url.hostname,
            pathAndQuery: url.pathname + url.search,
        }
    }
    catch {
        return undefined
    }
}

function parseConnectTarget(raw: string): ConnectTarget | undefined {
    const lastColon = raw.lastIndexOf(':')
    if (lastColon <= 0) return undefined
    const hostname = raw.slice(0, lastColon).replace(/^\[|\]$/g, '')
    const port = parseInt(raw.slice(lastColon + 1), 10)
    if (!Number.isFinite(port) || port <= 0 || port > 65535) return undefined
    return { hostname, port }
}

function stripProxyHeaders(headers: IncomingMessage['headers']): Record<string, string | string[]> {
    const out: Record<string, string | string[]> = {}
    for (const [key, value] of Object.entries(headers)) {
        if (value === undefined) continue
        const lower = key.toLowerCase()
        if (lower === 'proxy-connection' || lower === 'proxy-authorization') continue
        out[key] = value
    }
    return out
}

function writeConnectError(socket: Duplex, status: string): void {
    if (socket.writable) {
        socket.write(`HTTP/1.1 ${status}\r\nContent-Length: 0\r\n\r\n`)
    }
    socket.destroy()
}

class BlockedHostError extends Error {
    constructor(public host: string, public ip: string) {
        super(`Egress blocked: ${host} (${ip})`)
        this.name = 'BlockedHostError'
    }
}

type StartOptions = {
    log: Logger
    allowList: string[]
}

type HttpForwardArgs = {
    req: IncomingMessage
    res: ServerResponse
    allowList: string[]
    log: Logger
}

type ConnectArgs = {
    req: IncomingMessage
    clientSocket: Duplex
    head: Buffer
    allowList: string[]
    log: Logger
}

type ForwardTarget = {
    hostname: string
    port: number
    hostHeader: string
    pathAndQuery: string
}

type ConnectTarget = {
    hostname: string
    port: number
}

export type EgressProxy = {
    port: number
    close: () => Promise<void>
}
