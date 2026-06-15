import dns from 'node:dns/promises'
import http from 'node:http'
import net from 'node:net'
import { type Duplex } from 'node:stream'
import { type ApLogger } from '@activepieces/server-utils'
import { ssrfIpClassifier } from '@activepieces/shared'

export async function startEgressProxy({ log, host, allowList }: StartOptions): Promise<EgressProxy> {
    const bindHost = host ?? '127.0.0.1'
    const server = http.createServer()

    // CONNECT upgrades hand us raw sockets the http server no longer tracks, so
    // server.close() alone would hang waiting on live tunnels. Track every tunnel socket
    // and destroy them on close so shutdown is prompt even with open tunnels.
    const openSockets = new Set<Duplex>()
    const track = (socket: Duplex): void => {
        openSockets.add(socket)
        socket.once('close', () => openSockets.delete(socket))
    }

    server.on('request', (req, res) => {
        handleForwardRequest({ req, res, allowList, log }).catch((err) => {
            log.error({ err: String(err) }, 'Egress proxy forward handler crashed')
            if (!res.headersSent) res.writeHead(500)
            res.end()
        })
    })

    server.on('connect', (req, clientSocket, head) => {
        handleConnect({ req, clientSocket, head, allowList, log, track }).catch((err) => {
            log.error({ err: String(err) }, 'Egress proxy CONNECT handler crashed')
            writeSocketStatus({ socket: clientSocket, status: 500, message: 'Internal proxy error' })
        })
    })

    // A client that sends a malformed request line (e.g. CONNECT host:abc) trips Node's
    // clientError before our handlers see it; answer 400 instead of letting Node hang up raw.
    server.on('clientError', (_err, socket) => {
        if (socket.writable) writeSocketStatus({ socket, status: 400, message: 'Bad request' })
    })

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, bindHost, () => {
            server.removeListener('error', reject)
            resolve()
        })
    })

    const address = server.address()
    if (typeof address !== 'object' || address === null) {
        throw new Error('Could not determine egress proxy port')
    }
    log.info({ host: bindHost, port: address.port }, 'Egress proxy listening')

    return {
        port: address.port,
        close: () => new Promise<void>((resolve) => {
            for (const socket of openSockets) socket.destroy()
            openSockets.clear()
            server.closeAllConnections()
            server.close(() => resolve())
        }),
    }
}

// Resolve the hostname ONCE, validate EVERY A/AAAA record, and return the validated IP we
// will dial. This closes the DNS-rebind TOCTOU (ADR 0001 hard condition): proxy-chain
// re-resolved on connect, leaving a timing crack between validation and dial. By resolving
// here and dialing this exact IP below, the IP we checked is the IP we connect to — under
// the netns model the proxy is the single egress door, so there is no other path to pin.
async function resolveAndPinIp({ hostname, allowList }: ResolvePinParams): Promise<string> {
    if (net.isIP(hostname) > 0) {
        if (ssrfIpClassifier.isBlockedIp({ ip: hostname, allowList })) {
            throw new EgressBlockedError(hostname, [hostname])
        }
        return hostname
    }
    const resolved = await dns.lookup(hostname, { all: true })
    const ips = resolved.map((a) => a.address)
    const blocked = ips.find((ip) => ssrfIpClassifier.isBlockedIp({ ip, allowList }))
    if (blocked || ips.length === 0) {
        throw new EgressBlockedError(hostname, ips)
    }
    // Dial the first validated record; every record was validated above so any choice is safe.
    return ips[0]!
}

async function handleConnect({ req, clientSocket, head, allowList, log, track }: ConnectParams): Promise<void> {
    track(clientSocket)
    clientSocket.on('error', () => clientSocket.destroy())
    const target = parseConnectTarget(req.url ?? '')
    if (target === null) {
        writeSocketStatus({ socket: clientSocket, status: 400, message: 'Malformed CONNECT target' })
        return
    }

    const { data: pinnedIp, error } = await tryResolve({ hostname: target.hostname, allowList })
    if (error) {
        if (error instanceof EgressBlockedError) {
            log.warn({ host: target.hostname, allResolvedIps: error.resolvedIps }, 'Egress proxy refused CONNECT')
            writeSocketStatus({ socket: clientSocket, status: 403, message: `Egress blocked: ${target.hostname}` })
            return
        }
        writeSocketStatus({ socket: clientSocket, status: 502, message: 'Egress proxy upstream resolve failed' })
        return
    }

    // Dial the validated IP (not the hostname): TLS SNI is carried by the client's own
    // ClientHello inside the tunnel, so dialing by IP stays TLS-safe.
    const upstream = net.connect(target.port, pinnedIp)
    track(upstream)
    upstream.on('error', () => {
        writeSocketStatus({ socket: clientSocket, status: 502, message: 'Egress proxy upstream connect failed' })
        upstream.destroy()
    })
    upstream.on('connect', () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        if (head.length > 0) upstream.write(head)
        upstream.pipe(clientSocket)
        clientSocket.pipe(upstream)
    })
    clientSocket.on('close', () => upstream.destroy())
}

async function handleForwardRequest({ req, res, allowList, log }: ForwardParams): Promise<void> {
    const targetUrl = parseForwardUrl(req.url ?? '')
    if (targetUrl === null) {
        res.writeHead(400, { 'content-type': 'text/plain' })
        res.end('Only absolute http:// URLs are supported')
        return
    }

    const port = targetUrl.port ? Number(targetUrl.port) : 80
    const { data: pinnedIp, error } = await tryResolve({ hostname: targetUrl.hostname, allowList })
    if (error) {
        if (error instanceof EgressBlockedError) {
            log.warn({ host: targetUrl.hostname, allResolvedIps: error.resolvedIps }, 'Egress proxy refused request')
            res.writeHead(403, { 'content-type': 'text/plain' })
            res.end(`Egress blocked: ${targetUrl.hostname}`)
            return
        }
        res.writeHead(502, { 'content-type': 'text/plain' })
        res.end('Egress proxy upstream resolve failed')
        return
    }

    const headers = { ...req.headers }
    // Preserve the original Host header so virtual-hosted origins still route correctly even
    // though we dial the pinned IP rather than the hostname.
    headers.host = headers.host ?? targetUrl.host
    const upstreamReq = http.request({
        host: pinnedIp,
        port,
        method: req.method,
        path: targetUrl.pathname + targetUrl.search,
        headers,
    }, (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers)
        upstreamRes.pipe(res)
    })
    upstreamReq.on('error', () => {
        if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' })
        res.end('Egress proxy upstream connect failed')
    })
    req.pipe(upstreamReq)
}

async function tryResolve({ hostname, allowList }: ResolvePinParams): Promise<{ data?: string, error?: Error }> {
    try {
        return { data: await resolveAndPinIp({ hostname, allowList }) }
    }
    catch (error) {
        return { error: error as Error }
    }
}

function parseConnectTarget(rawUrl: string): { hostname: string, port: number } | null {
    const lastColon = rawUrl.lastIndexOf(':')
    if (lastColon <= 0) return null
    const hostname = rawUrl.slice(0, lastColon)
    const portStr = rawUrl.slice(lastColon + 1)
    if (!/^\d+$/.test(portStr)) return null
    const port = Number(portStr)
    if (port < 1 || port > 65535) return null
    if (hostname.length === 0) return null
    return { hostname, port }
}

function parseForwardUrl(rawUrl: string): URL | null {
    try {
        const url = new URL(rawUrl)
        if (url.protocol !== 'http:') return null
        return url
    }
    catch {
        return null
    }
}

function writeSocketStatus({ socket, status, message }: { socket: Duplex, status: number, message: string }): void {
    if (!socket.writable) {
        socket.destroy()
        return
    }
    const statusText = http.STATUS_CODES[status] ?? 'Error'
    const body = message
    socket.end(
        `HTTP/1.1 ${status} ${statusText}\r\n` +
        'content-type: text/plain\r\n' +
        `content-length: ${Buffer.byteLength(body)}\r\n` +
        'connection: close\r\n' +
        `\r\n${body}`,
    )
}

class EgressBlockedError extends Error {
    readonly resolvedIps: string[]
    constructor(hostname: string, resolvedIps: string[]) {
        super(`Egress blocked: ${hostname}`)
        this.name = 'EgressBlockedError'
        this.resolvedIps = resolvedIps
    }
}

type StartOptions = {
    log: ApLogger
    host?: string
    allowList: string[]
}

type ResolvePinParams = {
    hostname: string
    allowList: string[]
}

type ConnectParams = {
    req: http.IncomingMessage
    clientSocket: Duplex
    head: Buffer
    allowList: string[]
    log: ApLogger
    track: (socket: Duplex) => void
}

type ForwardParams = {
    req: http.IncomingMessage
    res: http.ServerResponse
    allowList: string[]
    log: ApLogger
}

export type EgressProxy = {
    port: number
    close: () => Promise<void>
}
