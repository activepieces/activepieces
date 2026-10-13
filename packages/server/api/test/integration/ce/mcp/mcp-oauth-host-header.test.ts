import net from 'node:net'
import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let port: number

function rawRequest({ target, host }: { target: string, host: string }): Promise<string> {
    return new Promise((resolve, reject) => {
        const socket = net.connect({ port, host: '127.0.0.1' }, () => {
            socket.write(`GET ${target} HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`)
        })
        let data = ''
        socket.on('data', (chunk) => {
            data += chunk.toString()
        })
        socket.on('end', () => resolve(data))
        socket.on('error', reject)
    })
}

describe('MCP OAuth discovery over a raw socket', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
        await app.listen({ port: 0, host: '127.0.0.1' })
        const address = app.server.address()
        port = typeof address === 'object' && address !== null ? address.port : 0
    })

    it.each([
        ['space', 'a b.com'],
        ['tab', 'a\tb.com'],
        ['percent', 'ex%ample.com'],
        ['pipe', 'a|b.com'],
        ['angle', 'a<b.com'],
        ['quote', 'ev"il.com'],
        ['backslash', 'a\\b.com'],
        ['truncated ipv6', '[foo'],
        ['bad port', 'evil.com:99999'],
    ])('a malformed Host header (%s) falls back to the configured origin instead of failing', async (_name, host) => {
        const res = await rawRequest({ target: '/.well-known/oauth-authorization-server', host })
        const status = res.split('\r\n')[0]
        const body = res.slice(res.indexOf('\r\n\r\n'))
        const issuer = (body.match(/"issuer":"([^"]*)"/) ?? [])[1]

        expect(status).not.toContain(' 500')
        expect(res).not.toContain('ERR_INVALID_URL')
        expect(issuer).toMatch(/^https?:\/\/[A-Za-z0-9._\-:[\]]+$/)
    })
})
