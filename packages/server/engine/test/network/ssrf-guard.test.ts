import dns from 'node:dns'
import { connect as netConnect, createServer, Server, Socket } from 'node:net'
import { SSRFBlockedError } from '@activepieces/shared'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ssrfGuard } from '../../src/lib/network/ssrf-guard'

function connectOnce(options: { host: string, port: number }, timeoutMs = 2_000): Promise<{ connected: boolean, error?: Error }> {
    return new Promise((resolve) => {
        const socket = new Socket()
        let settled = false
        const settle = (result: { connected: boolean, error?: Error }): void => {
            if (settled) {
                return
            }
            settled = true
            clearTimeout(timer)
            socket.removeAllListeners()
            socket.destroy()
            resolve(result)
        }
        const timer = setTimeout(() => settle({ connected: false, error: new Error('connect-timeout') }), timeoutMs)
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

    // The pin has to win over the real resolver AND over the blocked-IP check.
    describe('dns.lookup hook — pinned app API hostname', () => {
        afterEach(() => {
            vi.restoreAllMocks()
            delete process.env['AP_SANDBOX_API_HOST_PIN']
        })

        it('promises api: returns the pinned private addresses without consulting the resolver', async () => {
            const resolver = vi.spyOn(dns.promises, 'lookup')
            ssrfGuard.install({ enabled: true, allowList: [], pinnedHosts: { 'api.internal': ['10.0.0.9', '10.0.0.10'] } })
            const single = await dns.promises.lookup('api.internal')
            expect(single).toEqual({ address: '10.0.0.9', family: 4 })
            const all = await dns.promises.lookup('api.internal', { all: true })
            expect(all).toEqual([{ address: '10.0.0.9', family: 4 }, { address: '10.0.0.10', family: 4 }])
            expect(resolver).not.toHaveBeenCalled()
        })

        it('callback api: returns the pinned addresses, asynchronously, in both shapes', async () => {
            const resolver = vi.spyOn(dns, 'lookup')
            ssrfGuard.install({ enabled: true, allowList: [], pinnedHosts: { 'api.internal': ['10.0.0.9'] } })
            let calledSynchronously = true
            const single = await new Promise<{ err: unknown, address: unknown, family: unknown }>((resolve) => {
                dns.lookup('api.internal', (err, address, family) => {
                    expect(calledSynchronously).toBe(false)
                    resolve({ err, address, family })
                })
                calledSynchronously = false
            })
            expect(single).toEqual({ err: null, address: '10.0.0.9', family: 4 })
            const all = await new Promise<unknown>((resolve) => {
                dns.lookup('api.internal', { all: true }, (_err, address) => resolve(address))
            })
            expect(all).toEqual([{ address: '10.0.0.9', family: 4 }])
            expect(resolver).not.toHaveBeenCalled()
        })

        it('reads the pin from AP_SANDBOX_API_HOST_PIN and matches the hostname case-insensitively', async () => {
            process.env['AP_SANDBOX_API_HOST_PIN'] = 'API.Internal=10.0.0.9'
            ssrfGuard.install({ enabled: true, allowList: [] })
            await expect(dns.promises.lookup('api.internal')).resolves.toEqual({ address: '10.0.0.9', family: 4 })
        })

        it('leaves every other hostname on the real resolver and still blocked', async () => {
            vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '10.0.0.1', family: 4 }] as unknown as dns.LookupAddress)
            ssrfGuard.install({ enabled: true, allowList: [], pinnedHosts: { 'api.internal': ['10.0.0.9'] } })
            await expect(dns.promises.lookup('other.internal')).rejects.toBeInstanceOf(SSRFBlockedError)
        })

        it('ignores a pin whose addresses are not IPv4 literals', async () => {
            vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '10.0.0.1', family: 4 }] as unknown as dns.LookupAddress)
            ssrfGuard.install({ enabled: true, allowList: [], pinnedHosts: { 'api.internal': ['999.1.1.1', 'not-an-ip'] } })
            await expect(dns.promises.lookup('api.internal')).rejects.toBeInstanceOf(SSRFBlockedError)
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

        it('allows loopback target on a whitelisted port (engine↔worker RPC)', async () => {
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

        it('allows a private gateway host:port pair without allowlisting the whole IP', async () => {
            ssrfGuard.install({
                enabled: true,
                allowList: [],
                allowedHostPorts: ['10.255.0.5:9'],
            })
            const allowed = await connectOnce({ host: '10.255.0.5', port: 9 }, 200)
            expect(allowed.error).not.toBeInstanceOf(SSRFBlockedError)
            const blocked = await connectOnce({ host: '10.255.0.5', port: 10 })
            expect(blocked.connected).toBe(false)
            expect(blocked.error).toBeInstanceOf(SSRFBlockedError)
        })

        it('allows AP_SANDBOX_API_ALLOW host:port from env without allowlisting the whole IP', async () => {
            process.env['AP_SANDBOX_API_ALLOW'] = '10.0.0.9:3000'
            try {
                ssrfGuard.install({ enabled: true, allowList: [] })
                const allowed = await connectOnce({ host: '10.0.0.9', port: 3000 }, 200)
                expect(allowed.error).not.toBeInstanceOf(SSRFBlockedError)
                const blocked = await connectOnce({ host: '10.0.0.9', port: 6379 })
                expect(blocked.connected).toBe(false)
                expect(blocked.error).toBeInstanceOf(SSRFBlockedError)
            }
            finally {
                delete process.env['AP_SANDBOX_API_ALLOW']
            }
        })

        // Exempting only the first address let undici's choice decide whether the job worked.
        it('exempts EVERY endpoint in a comma-separated AP_SANDBOX_API_ALLOW, not just the first', async () => {
            process.env['AP_SANDBOX_API_ALLOW'] = '10.0.0.9:3000,10.0.0.10:3000'
            try {
                ssrfGuard.install({ enabled: true, allowList: [] })
                const first = await connectOnce({ host: '10.0.0.9', port: 3000 }, 200)
                expect(first.error).not.toBeInstanceOf(SSRFBlockedError)
                const second = await connectOnce({ host: '10.0.0.10', port: 3000 }, 200)
                expect(second.error).not.toBeInstanceOf(SSRFBlockedError)
                const blocked = await connectOnce({ host: '10.0.0.11', port: 3000 })
                expect(blocked.connected).toBe(false)
                expect(blocked.error).toBeInstanceOf(SSRFBlockedError)
            }
            finally {
                delete process.env['AP_SANDBOX_API_ALLOW']
            }
        })

        it('rejects a malformed AP_SANDBOX_API_ALLOW octet instead of exempting it', async () => {
            process.env['AP_SANDBOX_API_ALLOW'] = '999.999.999.999:3000'
            try {
                ssrfGuard.install({ enabled: true, allowList: [] })
                const blocked = await connectOnce({ host: '10.0.0.9', port: 3000 })
                expect(blocked.error).toBeInstanceOf(SSRFBlockedError)
            }
            finally {
                delete process.env['AP_SANDBOX_API_ALLOW']
            }
        })

        // Asserting only that fetch rejects proves nothing, so the guard's own error has to be the cause.
        it('blocks a raw private IP reached through fetch (the net.connect normalized-args path)', async () => {
            ssrfGuard.install({ enabled: true, allowList: [] })
            const cause = await fetch('http://10.0.0.5:443/').then(
                () => null,
                (error: { cause?: unknown }) => error.cause,
            )
            expect(cause).toBeInstanceOf(SSRFBlockedError)
        })

        it('blocks a raw private IP reached through net.connect(options)', async () => {
            ssrfGuard.install({ enabled: true, allowList: [] })
            const error = await new Promise<Error>((resolve) => {
                const socket = netConnect({ host: '169.254.169.254', port: 80 })
                socket.once('error', resolve)
                socket.once('connect', () => {
                    socket.destroy()
                    resolve(new Error('connected'))
                })
            })
            expect(error).toBeInstanceOf(SSRFBlockedError)
        })

        it('allowList overrides block for raw IP connect', async () => {
            ssrfGuard.install({ enabled: true, allowList: ['127.0.0.1'] })
            const result = await connectOnce({ host: '127.0.0.1', port: publicPort })
            expect(result.connected).toBe(true)
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
