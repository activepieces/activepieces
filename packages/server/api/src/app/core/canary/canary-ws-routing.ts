import http, { IncomingMessage } from 'node:http'
import https from 'node:https'
import { Duplex } from 'node:stream'
import { isNil } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { canaryCookie } from './canary-cookie'

const SOCKET_IO_PATH = '/api/socket.io'
const UPSTREAM_TIMEOUT_MS = 10_000

// Transparent ws passthrough to the fixed CANARY_APP_URL (no frame parsing → no `ws` dep, no SSRF).
// See .agents/features/canary.md.
export const canaryWsRouting = {
    // Captures socket.io's own 'upgrade' listeners, then routes: canary-cookied /api/socket.io → canary,
    // everything else → the captured listeners.
    install(app: FastifyInstance): void {
        const canaryAppUrl = system.get(AppSystemProp.CANARY_APP_URL)
        if (isNil(canaryAppUrl)) {
            return
        }
        const server = app.server
        const socketIoListeners = server.listeners('upgrade')
        server.removeAllListeners('upgrade')
        server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
            if (canaryWsRouting.shouldProxy({ app, url: request.url, cookieHeader: request.headers.cookie })) {
                proxyUpgrade({ canaryAppUrl, request, clientSocket: socket, head, app })
                return
            }
            for (const listener of socketIoListeners) {
                listener.call(server, request, socket, head)
            }
        })
    },
    shouldProxy({ app, url, cookieHeader }: ShouldProxyParams): boolean {
        if (isNil(url) || !url.startsWith(SOCKET_IO_PATH)) {
            return false
        }
        return canaryCookie.isValidHeader(app, cookieHeader)
    },
}

function proxyUpgrade({ canaryAppUrl, request, clientSocket, head, app }: ProxyUpgradeParams): void {
    const target = new URL(canaryAppUrl)
    const client = target.protocol === 'https:' ? https : http
    const destroyBoth = (error: Error, upstreamSocket?: Duplex): void => {
        app.log.error({ error, url: request.url }, '[canaryWsRouting] ws proxy failed')
        upstreamSocket?.destroy()
        clientSocket.destroy()
    }

    const proxyReq = client.request({
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port === '' ? undefined : target.port,
        method: request.method,
        path: request.url,
        headers: request.headers,
        timeout: UPSTREAM_TIMEOUT_MS,
    })

    proxyReq.on('upgrade', (proxyRes, upstreamSocket, upstreamHead) => {
        const statusLine = `HTTP/1.1 ${proxyRes.statusCode} ${proxyRes.statusMessage}`
        const headerLines = Object.entries(proxyRes.headers).flatMap(([key, value]) =>
            (Array.isArray(value) ? value : [value]).filter((v): v is string => !isNil(v)).map((v) => `${key}: ${v}`),
        )
        clientSocket.write([statusLine, ...headerLines, '\r\n'].join('\r\n'))

        if (upstreamHead.length > 0) {
            clientSocket.write(upstreamHead)
        }
        if (head.length > 0) {
            upstreamSocket.write(head)
        }

        upstreamSocket.on('error', (error) => destroyBoth(error, upstreamSocket))
        clientSocket.on('error', (error) => destroyBoth(error, upstreamSocket))
        upstreamSocket.pipe(clientSocket)
        clientSocket.pipe(upstreamSocket)
    })
    proxyReq.on('timeout', () => {
        // A 'timeout' does not close the request — destroy it so the upstream socket isn't leaked.
        proxyReq.destroy()
        destroyBoth(new Error('canary ws upstream timeout'))
    })
    proxyReq.on('error', (error) => destroyBoth(error))
    proxyReq.end()
}

type ShouldProxyParams = {
    app: FastifyInstance
    url: string | undefined
    cookieHeader: string | undefined
}

type ProxyUpgradeParams = {
    canaryAppUrl: string
    request: IncomingMessage
    clientSocket: Duplex
    head: Buffer
    app: FastifyInstance
}
