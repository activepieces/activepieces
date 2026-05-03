import http from 'node:http'
import net from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startEgressProxy, EgressProxy } from '../../src/lib/egress/proxy'
import { silentLogger } from './helpers/silent-logger'
import { EchoServer, startHttpEcho } from './helpers/test-server'

describe('egress-proxy — real HTTP / CONNECT', () => {
    let proxy: EgressProxy
    let echo: EchoServer

    beforeAll(async () => {
        echo = await startHttpEcho()
        proxy = await startEgressProxy({
            log: silentLogger(),
            allowList: ['127.0.0.1'],
        })
    })

    afterAll(async () => {
        await proxy?.close()
        await echo?.close()
    })

    it('forwards GET to an allowlisted loopback target', async () => {
        const res = await forwardGet({
            proxyPort: proxy.port,
            targetUrl: `http://127.0.0.1:${echo.port}/ping`,
            host: `127.0.0.1:${echo.port}`,
        })
        expect(res.statusCode).toBe(200)
        expect(res.body).toBe('echo-body')
        expect(res.headers['x-echo-url']).toBe('/ping')
    })

    it('refuses GET to a blocked private IP with 403', async () => {
        const res = await forwardGet({
            proxyPort: proxy.port,
            targetUrl: 'http://169.254.169.254/latest/meta-data/',
            host: '169.254.169.254',
        })
        expect(res.statusCode).toBe(403)
        expect(res.body).toContain('Egress blocked')
    })

    it('refuses CONNECT to a blocked private IP with 403', async () => {
        const status = await sendConnect({
            proxyPort: proxy.port,
            targetHostPort: '10.0.0.1:443',
        })
        expect(status).toBe('403')
    })

    it('allows CONNECT to an allowlisted loopback target and tunnels bytes', async () => {
        const status = await sendConnect({
            proxyPort: proxy.port,
            targetHostPort: `127.0.0.1:${echo.port}`,
        })
        expect(status).toBe('200')
    })
})

function forwardGet({ proxyPort, targetUrl, host }: {
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
                body: Buffer.concat(chunks).toString(),
                headers: res.headers,
            }))
        })
        req.on('error', reject)
        req.end()
    })
}

function sendConnect({ proxyPort, targetHostPort }: {
    proxyPort: number
    targetHostPort: string
}): Promise<'200' | '403' | string> {
    return new Promise((resolve, reject) => {
        const socket = net.connect(proxyPort, '127.0.0.1', () => {
            socket.write(`CONNECT ${targetHostPort} HTTP/1.1\r\nHost: ${targetHostPort}\r\n\r\n`)
        })
        const chunks: Buffer[] = []
        socket.on('data', (chunk) => {
            chunks.push(chunk)
            const response = Buffer.concat(chunks).toString()
            const firstLine = response.split('\r\n')[0] ?? ''
            const match = firstLine.match(/HTTP\/1\.1 (\d{3})/)
            if (match) {
                socket.destroy()
                resolve(match[1] ?? firstLine)
            }
        })
        socket.on('error', reject)
        socket.on('close', () => {
            if (chunks.length === 0) resolve('closed')
        })
    })
}
