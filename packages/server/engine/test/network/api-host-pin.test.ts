import { createServer as createHttpServer, Server as HttpServer } from 'node:http'
import { createServer as createTcpServer, Server as TcpServer } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { ssrfGuard } from '../../src/lib/network/ssrf-guard'

// Asserts what the engine puts ON THE WIRE, because rewriting the URL silently dropped SNI and the Host.

function readClientHelloSni(bytes: Buffer): string | null {
    // TLS record header (5) + handshake header (4) + version (2) + random (32).
    let offset = 5 + 4 + 2 + 32
    if (bytes.length < offset + 1) {
        return null
    }
    offset += 1 + bytes[offset]
    if (bytes.length < offset + 2) {
        return null
    }
    offset += 2 + bytes.readUInt16BE(offset)
    if (bytes.length < offset + 1) {
        return null
    }
    offset += 1 + bytes[offset]
    if (bytes.length < offset + 2) {
        return null
    }
    const extensionsEnd = offset + 2 + bytes.readUInt16BE(offset)
    offset += 2
    while (offset + 4 <= Math.min(extensionsEnd, bytes.length)) {
        const type = bytes.readUInt16BE(offset)
        const length = bytes.readUInt16BE(offset + 2)
        if (type === 0) {
            const nameLength = bytes.readUInt16BE(offset + 7)
            return bytes.subarray(offset + 9, offset + 9 + nameLength).toString('utf8')
        }
        offset += 4 + length
    }
    return null
}

describe('app API host pin', () => {
    let httpServer: HttpServer | null = null
    let tcpServer: TcpServer | null = null

    afterEach(async () => {
        ssrfGuard.uninstall()
        delete process.env['AP_SANDBOX_API_HOST_PIN']
        delete process.env['AP_SANDBOX_API_ALLOW']
        await new Promise<void>((resolve) => (httpServer ? httpServer.close(() => resolve()) : resolve()))
        await new Promise<void>((resolve) => (tcpServer ? tcpServer.close(() => resolve()) : resolve()))
        httpServer = null
        tcpServer = null
    })

    it('sends the app hostname as TLS SNI while connecting to the pinned address', async () => {
        const sni = await new Promise<string | null>((resolve, reject) => {
            tcpServer = createTcpServer((socket) => {
                socket.once('data', (chunk) => {
                    resolve(readClientHelloSni(chunk))
                    socket.destroy()
                })
            })
            tcpServer.listen(0, '127.0.0.1', () => {
                const port = (tcpServer!.address() as { port: number }).port
                process.env['AP_SANDBOX_API_HOST_PIN'] = 'app.internal.test=127.0.0.1'
                process.env['AP_SANDBOX_API_ALLOW'] = `127.0.0.1:${port}`
                ssrfGuard.install({ enabled: true, allowList: [] })
                // The URL keeps the hostname exactly as the operator configured it.
                fetch(`https://app.internal.test:${port}/api/v1/engine/populated-flows`).catch(() => undefined)
            })
            tcpServer.once('error', reject)
        })

        expect(sni).toBe('app.internal.test')
        expect(sni).not.toBe('127.0.0.1')
    })

    it('sends the app hostname as the Host header and keeps the path, over the pinned address', async () => {
        const request = await new Promise<{ host: string | undefined, url: string | undefined }>((resolve, reject) => {
            httpServer = createHttpServer((req, res) => {
                res.writeHead(200)
                res.end()
                resolve({ host: req.headers.host, url: req.url })
            })
            httpServer.listen(0, '127.0.0.1', () => {
                const port = (httpServer!.address() as { port: number }).port
                process.env['AP_SANDBOX_API_HOST_PIN'] = 'app.internal.test=127.0.0.1'
                process.env['AP_SANDBOX_API_ALLOW'] = `127.0.0.1:${port}`
                ssrfGuard.install({ enabled: true, allowList: [] })
                fetch(`http://app.internal.test:${port}/api/v1/engine/populated-flows`).catch(() => undefined)
            })
            httpServer.once('error', reject)
        })

        expect(request.host).toBe(`app.internal.test:${(httpServer!.address() as { port: number }).port}`)
        expect(request.url).toBe('/api/v1/engine/populated-flows')
    })

    it('cannot reach a pinned address on a port the kernel did not open', async () => {
        await new Promise<void>((resolve, reject) => {
            httpServer = createHttpServer((_req, res) => {
                res.writeHead(200)
                res.end()
            })
            httpServer.listen(0, '127.0.0.1', () => resolve())
            httpServer.once('error', reject)
        })
        const port = (httpServer!.address() as { port: number }).port
        process.env['AP_SANDBOX_API_HOST_PIN'] = 'app.internal.test=127.0.0.1'
        process.env['AP_SANDBOX_API_ALLOW'] = `127.0.0.1:${port + 1}`
        ssrfGuard.install({ enabled: true, allowList: [] })

        // The pin resolves the name but the socket guard still gates the connect: one endpoint, nothing more.
        await expect(fetch(`http://app.internal.test:${port}/api/`)).rejects.toThrow()
    })
})
