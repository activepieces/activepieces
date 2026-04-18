import dns from 'node:dns'
import { Socket, createServer, Server } from 'node:net'
import { EngineGenericError } from '@activepieces/shared'
import { EnvHttpProxyAgent, getGlobalDispatcher, setGlobalDispatcher } from 'undici'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ssrfGuard } from '../../src/lib/network/ssrf-guard'

function connectOnce(options: { host: string, port: number }): Promise<{ connected: boolean, error?: Error }> {
    return new Promise((resolve) => {
        const socket = new Socket()
        const settle = (result: { connected: boolean, error?: Error }): void => {
            socket.removeAllListeners()
            socket.destroy()
            resolve(result)
        }
        socket.once('connect', () => settle({ connected: true }))
        socket.once('error', (err) => settle({ connected: false, error: err }))
        socket.connect(options)
    })
}

describe('ssrf-guard', () => {
    afterEach(() => {
        ssrfGuard.uninstall()
    })

    describe('isBlockedIp', () => {
        beforeEach(() => {
            ssrfGuard.install({ enabled: true, allowList: [] })
        })

        it.each([
            ['10.0.0.5', true],
            ['10.255.255.255', true],
            ['172.16.0.1', true],
            ['172.31.255.1', true],
            ['172.32.0.1', false],
            ['192.168.1.1', true],
            ['127.0.0.1', true],
            ['127.255.255.255', true],
            ['169.254.169.254', true],
            ['169.254.1.1', true],
            ['0.0.0.0', true],
            ['100.64.0.1', true],
            ['224.0.0.1', true],
            ['8.8.8.8', false],
            ['1.1.1.1', false],
            ['142.250.80.46', false],
            ['::1', true],
            ['::', true],
            ['fe80::1', true],
            ['fc00::1', true],
            ['fd00::1', true],
            ['ff02::1', true],
            ['::ffff:10.0.0.1', true],
            ['::ffff:169.254.169.254', true],
            ['::ffff:8.8.8.8', false],
            ['2001:4860:4860::8888', false],
        ])('%s → blocked=%s', (ip, expected) => {
            expect(ssrfGuard.isBlockedIp(ip)).toBe(expected)
        })

        it('allowList overrides block', () => {
            ssrfGuard.install({ enabled: true, allowList: ['10.0.0.5'] })
            expect(ssrfGuard.isBlockedIp('10.0.0.5')).toBe(false)
            expect(ssrfGuard.isBlockedIp('10.0.0.6')).toBe(true)
        })
    })

    describe('dns.lookup hook', () => {
        it('rejects hostname resolving to loopback via promises api', async () => {
            ssrfGuard.install({ enabled: true, allowList: [] })
            await expect(dns.promises.lookup('localhost')).rejects.toBeInstanceOf(EngineGenericError)
        })

        it('rejects hostname resolving to loopback via callback api', async () => {
            ssrfGuard.install({ enabled: true, allowList: [] })
            const err = await new Promise<unknown>((resolve) => {
                dns.lookup('localhost', (e) => resolve(e))
            })
            expect(err).toBeInstanceOf(EngineGenericError)
        })

        it('honours allowList for normally blocked IP', async () => {
            ssrfGuard.install({ enabled: true, allowList: ['127.0.0.1'] })
            const result = await dns.promises.lookup('localhost', { family: 4 })
            expect(result.address).toBe('127.0.0.1')
        })
    })

    describe('net.Socket.connect hook', () => {
        let publicServer: Server
        let publicPort: number

        beforeAll(async () => {
            publicServer = createServer((socket) => socket.end())
            await new Promise<void>((resolve) => publicServer.listen(0, '127.0.0.1', () => resolve()))
            publicPort = (publicServer.address() as { port: number }).port
        })

        afterAll(() => {
            publicServer.close()
        })

        it('blocks raw connect to private IP', async () => {
            ssrfGuard.install({ enabled: true, allowList: [] })
            const result = await connectOnce({ host: '169.254.169.254', port: 80 })
            expect(result.connected).toBe(false)
            expect(result.error).toBeInstanceOf(EngineGenericError)
        })

        it('blocks connect({ host, port }) to RFC1918 IP', async () => {
            ssrfGuard.install({ enabled: true, allowList: [] })
            const result = await connectOnce({ host: '10.0.0.5', port: 443 })
            expect(result.connected).toBe(false)
            expect(result.error).toBeInstanceOf(EngineGenericError)
        })

        it('allows loopback target on a whitelisted port (engine↔worker RPC, egress proxy)', async () => {
            ssrfGuard.install({ enabled: true, allowList: [], allowedLoopbackPorts: [publicPort] })
            const result = await connectOnce({ host: '127.0.0.1', port: publicPort })
            expect(result.connected).toBe(true)
        })

        it('blocks loopback connection to non-whitelisted ports', async () => {
            ssrfGuard.install({ enabled: true, allowList: [], allowedLoopbackPorts: [publicPort + 1] })
            const result = await connectOnce({ host: '127.0.0.1', port: publicPort })
            expect(result.connected).toBe(false)
            expect(result.error).toBeInstanceOf(EngineGenericError)
        })

        it('allowList overrides block for raw IP connect', async () => {
            ssrfGuard.install({ enabled: true, allowList: ['127.0.0.1'] })
            const result = await connectOnce({ host: '127.0.0.1', port: publicPort })
            expect(result.connected).toBe(true)
        })
    })

    describe('undici global dispatcher', () => {
        const originalHttpsProxy = process.env['HTTPS_PROXY']
        const originalDispatcher = getGlobalDispatcher()

        afterEach(() => {
            if (originalHttpsProxy === undefined) delete process.env['HTTPS_PROXY']
            else process.env['HTTPS_PROXY'] = originalHttpsProxy
            setGlobalDispatcher(originalDispatcher)
        })

        it('replaces the global dispatcher with an EnvHttpProxyAgent when HTTPS_PROXY is set', () => {
            process.env['HTTPS_PROXY'] = 'http://127.0.0.1:4444'
            ssrfGuard.install({ enabled: true, allowList: [] })
            expect(getGlobalDispatcher()).toBeInstanceOf(EnvHttpProxyAgent)
        })

        it('leaves dispatcher untouched when no proxy env is set', () => {
            delete process.env['HTTPS_PROXY']
            delete process.env['HTTP_PROXY']
            delete process.env['https_proxy']
            delete process.env['http_proxy']
            const before = getGlobalDispatcher()
            ssrfGuard.install({ enabled: true, allowList: [] })
            expect(getGlobalDispatcher()).toBe(before)
        })
    })

    describe('disabled guard', () => {
        it('leaves dns.lookup untouched', async () => {
            ssrfGuard.install({ enabled: false })
            expect(ssrfGuard.isEnabled()).toBe(false)
            const result = await dns.promises.lookup('localhost')
            expect(result.address).toMatch(/127\.0\.0\.1|::1/)
        })

        it('leaves net.Socket.connect untouched', async () => {
            ssrfGuard.install({ enabled: false })
            const server = createServer((s) => s.end())
            await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()))
            const port = (server.address() as { port: number }).port
            try {
                const result = await connectOnce({ host: '127.0.0.1', port })
                expect(result.connected).toBe(true)
            }
            finally {
                server.close()
            }
        })
    })
})
