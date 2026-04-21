import dns from 'node:dns'
import { Socket, createServer, Server } from 'node:net'
import { SSRFBlockedError } from '@activepieces/shared'
import { EnvHttpProxyAgent, getGlobalDispatcher, setGlobalDispatcher } from 'undici'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
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

        it('allowList supports CIDR entries', () => {
            ssrfGuard.install({ enabled: true, allowList: ['10.0.0.0/24'] })
            expect(ssrfGuard.isBlockedIp('10.0.0.1')).toBe(false)
            expect(ssrfGuard.isBlockedIp('10.0.0.254')).toBe(false)
            expect(ssrfGuard.isBlockedIp('10.0.1.1')).toBe(true)
        })

        it('allowList rejects CIDR entry crossing address families', () => {
            ssrfGuard.install({ enabled: true, allowList: ['10.0.0.0/24'] })
            expect(ssrfGuard.isBlockedIp('::1')).toBe(true)
        })
    })

    describe('dns.lookup hook', () => {
        it('rejects hostname resolving to loopback via promises api', async () => {
            ssrfGuard.install({ enabled: true, allowList: [] })
            await expect(dns.promises.lookup('localhost')).rejects.toBeInstanceOf(SSRFBlockedError)
        })

        it('rejects hostname resolving to loopback via callback api', async () => {
            ssrfGuard.install({ enabled: true, allowList: [] })
            const err = await new Promise<unknown>((resolve) => {
                dns.lookup('localhost', (e) => resolve(e))
            })
            expect(err).toBeInstanceOf(SSRFBlockedError)
        })

        it('honours allowList for normally blocked IP', async () => {
            ssrfGuard.install({ enabled: true, allowList: ['127.0.0.1'] })
            const result = await dns.promises.lookup('localhost', { family: 4 })
            expect(result.address).toBe('127.0.0.1')
        })
    })

    describe('dns.lookup hook — multi-A-record coverage', () => {
        const publicThenPrivate = [
            { address: '8.8.8.8', family: 4 },
            { address: '10.0.0.1', family: 4 },
        ]
        const allPublic = [
            { address: '8.8.8.8', family: 4 },
            { address: '1.1.1.1', family: 4 },
        ]

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('promises api: blocks when caller omits { all: true } but one A record is private', async () => {
            vi.spyOn(dns.promises, 'lookup').mockResolvedValue(publicThenPrivate as unknown as dns.LookupAddress)
            ssrfGuard.install({ enabled: true, allowList: [] })
            await expect(dns.promises.lookup('multi.example.test')).rejects.toBeInstanceOf(SSRFBlockedError)
        })

        it('promises api: blocks when caller passes { all: true } and one A record is private', async () => {
            vi.spyOn(dns.promises, 'lookup').mockResolvedValue(publicThenPrivate as unknown as dns.LookupAddress)
            ssrfGuard.install({ enabled: true, allowList: [] })
            await expect(dns.promises.lookup('multi.example.test', { all: true })).rejects.toBeInstanceOf(SSRFBlockedError)
        })

        it('promises api: returns single-entry shape when caller omits { all: true } and all records are public', async () => {
            vi.spyOn(dns.promises, 'lookup').mockResolvedValue(allPublic as unknown as dns.LookupAddress)
            ssrfGuard.install({ enabled: true, allowList: [] })
            const result = await dns.promises.lookup('public.example.test')
            expect(Array.isArray(result)).toBe(false)
            expect((result as dns.LookupAddress).address).toBe('8.8.8.8')
        })

        it('promises api: returns array shape when caller passes { all: true } and all records are public', async () => {
            vi.spyOn(dns.promises, 'lookup').mockResolvedValue(allPublic as unknown as dns.LookupAddress)
            ssrfGuard.install({ enabled: true, allowList: [] })
            const result = await dns.promises.lookup('public.example.test', { all: true })
            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(2)
        })

        it('callback api: blocks when caller omits { all: true } but one A record is private', async () => {
            vi.spyOn(dns, 'lookup').mockImplementation(((_host: unknown, _optionsOrCb: unknown, cb?: unknown) => {
                const callback = typeof _optionsOrCb === 'function' ? _optionsOrCb : cb
                ;(callback as (err: Error | null, addresses: dns.LookupAddress[]) => void)(null, publicThenPrivate)
            }) as unknown as typeof dns.lookup)
            ssrfGuard.install({ enabled: true, allowList: [] })
            const err = await new Promise<unknown>((resolve) => {
                dns.lookup('multi.example.test', (e) => resolve(e))
            })
            expect(err).toBeInstanceOf(SSRFBlockedError)
        })

        it('callback api: passes first public entry when caller omits { all: true }', async () => {
            vi.spyOn(dns, 'lookup').mockImplementation(((_host: unknown, _optionsOrCb: unknown, cb?: unknown) => {
                const callback = typeof _optionsOrCb === 'function' ? _optionsOrCb : cb
                ;(callback as (err: Error | null, addresses: dns.LookupAddress[]) => void)(null, allPublic)
            }) as unknown as typeof dns.lookup)
            ssrfGuard.install({ enabled: true, allowList: [] })
            const result = await new Promise<{ err: unknown, address: unknown, family: unknown }>((resolve) => {
                dns.lookup('public.example.test', (err, address, family) => resolve({ err, address, family }))
            })
            expect(result.err).toBeNull()
            expect(result.address).toBe('8.8.8.8')
            expect(result.family).toBe(4)
        })

        it('callback api: passes full array when caller passes { all: true }', async () => {
            vi.spyOn(dns, 'lookup').mockImplementation(((_host: unknown, _optionsOrCb: unknown, cb?: unknown) => {
                const callback = typeof _optionsOrCb === 'function' ? _optionsOrCb : cb
                ;(callback as (err: Error | null, addresses: dns.LookupAddress[]) => void)(null, allPublic)
            }) as unknown as typeof dns.lookup)
            ssrfGuard.install({ enabled: true, allowList: [] })
            const result = await new Promise<{ err: unknown, address: unknown }>((resolve) => {
                dns.lookup('public.example.test', { all: true }, (err, address) => resolve({ err, address }))
            })
            expect(result.err).toBeNull()
            expect(Array.isArray(result.address)).toBe(true)
            expect(result.address).toHaveLength(2)
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
            expect(result.error).toBeInstanceOf(SSRFBlockedError)
        })

        it('blocks connect({ host, port }) to RFC1918 IP', async () => {
            ssrfGuard.install({ enabled: true, allowList: [] })
            const result = await connectOnce({ host: '10.0.0.5', port: 443 })
            expect(result.connected).toBe(false)
            expect(result.error).toBeInstanceOf(SSRFBlockedError)
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
            expect(result.error).toBeInstanceOf(SSRFBlockedError)
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
