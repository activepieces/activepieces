import { beforeEach, describe, expect, it, vi } from 'vitest'
import dns from 'node:dns'
import { ssrfIpClassifier } from '@activepieces/core-utils'
import { sandboxCapacity } from '../../../src/lib/sandbox/capacity'
import { egressNetnsInternals } from '../../../src/lib/sandbox/netns'

function flat(commands: { binary: string, args: string[] }[]): string[] {
    return commands.map((c) => `${c.binary} ${c.args.join(' ')}`)
}

describe('egressNetnsInternals.buildTopology', () => {
    it('carves a /30 per box from 10.255.0.0/16 (gateway = net+1, box = net+2)', () => {
        const t = egressNetnsInternals.buildTopology(1)
        expect(t).toMatchObject({
            boxId: 1,
            netnsName: 'ap-egress-1',
            vethHost: 'ap-veth-h1',
            vethBox: 'ap-veth-b1',
            subnetCidr: '10.255.0.4/30',
            gatewayHost: '10.255.0.5',
            boxHost: '10.255.0.6',
            chain: 'AP_EG_FWD_1',
            rpcPort: sandboxCapacity.wsRpcPortForBox(1),
        })
    })

    it('rolls into the next third octet past box 63 (offset 256)', () => {
        const t = egressNetnsInternals.buildTopology(64)
        expect(t.subnetCidr).toBe('10.255.1.0/30')
        expect(t.gatewayHost).toBe('10.255.1.1')
        expect(t.boxHost).toBe('10.255.1.2')
    })

    it('gives distinct, non-overlapping /30s to distinct boxes', () => {
        const gateways = new Set<string>()
        for (let boxId = 1; boxId <= 200; boxId++) {
            gateways.add(egressNetnsInternals.buildTopology(boxId).gatewayHost)
        }
        expect(gateways.size).toBe(200)
    })

    it('throws when boxId exceeds the 10.255.0.0/16 pool', () => {
        expect(() => egressNetnsInternals.buildTopology(20000)).toThrow(/too large/)
    })
})

describe('egressNetnsInternals.buildCreateCommands', () => {
    const t = egressNetnsInternals.buildTopology(1)
    const commands = egressNetnsInternals.buildCreateCommands(t)
    const lines = flat(commands)

    it('creates the netns, veth pair, addressing and default route', () => {
        expect(lines).toContain('ip netns add ap-egress-1')
        expect(lines).toContain('ip link add ap-veth-h1 type veth peer name ap-veth-b1')
        expect(lines).toContain('ip link set ap-veth-b1 netns ap-egress-1')
        expect(lines).toContain('ip addr add 10.255.0.5/30 dev ap-veth-h1')
        expect(lines).toContain('ip netns exec ap-egress-1 ip addr add 10.255.0.6/30 dev ap-veth-b1')
        expect(lines).toContain('ip netns exec ap-egress-1 ip route add default via 10.255.0.5')
    })

    it('arms FORWARD/INPUT filters and ip6tables DROP before bringing links up', () => {
        const firstUp = lines.findIndex((l) => l.includes('link set') && l.endsWith(' up'))
        const forwardJump = lines.findIndex((l) => l.includes('-I FORWARD 1') && l.includes('AP_EG_FWD_1'))
        const ip6Drop = lines.findIndex((l) => l.includes('ip6tables') && l.includes('OUTPUT') && l.includes('DROP'))
        expect(firstUp).toBeGreaterThan(-1)
        expect(forwardJump).toBeGreaterThan(-1)
        expect(ip6Drop).toBeGreaterThan(-1)
        expect(forwardJump).toBeLessThan(firstUp)
        expect(ip6Drop).toBeLessThan(firstUp)
    })

    it('disables IPv6 addrgen on both veth ends before up', () => {
        expect(lines).toContain('ip link set ap-veth-h1 addrgenmode none')
        expect(lines).toContain('ip netns exec ap-egress-1 ip link set ap-veth-b1 addrgenmode none')
    })

    it('emits NO mtu commands when the uplink MTU could not be discovered (keeps the kernel default)', () => {
        expect(lines.some((l) => l.includes(' mtu '))).toBe(false)
    })

    it('sets the discovered MTU on BOTH veth ends before bringing them up (each end is independent)', () => {
        const withMtu = flat(egressNetnsInternals.buildCreateCommands(t, { mtu: 1450 }))
        expect(withMtu).toContain('ip link set ap-veth-h1 mtu 1450')
        expect(withMtu).toContain('ip netns exec ap-egress-1 ip link set ap-veth-b1 mtu 1450')
        const lastMtu = withMtu.reduce((acc, l, i) => (l.includes(' mtu ') ? i : acc), -1)
        const firstUp = withMtu.findIndex((l) => l.includes('link set') && l.endsWith(' up'))
        expect(lastMtu).toBeLessThan(firstUp)
    })

    it('NATs the box /30 out the uplink (never back into its own veth), inserted at the top of nat', () => {
        expect(lines).toContain('iptables -t nat -I POSTROUTING 1 -s 10.255.0.4/30 ! -o ap-veth-h1 -j MASQUERADE')
    })

    it('REJECTs 0.0.0.0/8, metadata, loopback and every RFC1918 range from the box', () => {
        for (const cidr of ['0.0.0.0/8', '169.254.0.0/16', '127.0.0.0/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '100.64.0.0/10']) {
            expect(lines).toContain(`iptables -A AP_EG_FWD_1 -d ${cidr} -j REJECT --reject-with icmp-host-prohibited`)
        }
    })

    it('drops all IPv6 out of the box netns (belt-and-suspenders for v6 metadata like fd00:ec2::254)', () => {
        expect(lines).toContain('ip netns exec ap-egress-1 ip6tables -A OUTPUT -j DROP')
    })

    it('rejects the pool first and puts public egress last (order matters)', () => {
        const chainRules = lines.filter((l) => l.startsWith('iptables -A AP_EG_FWD_1'))
        expect(chainRules[0]).toBe('iptables -A AP_EG_FWD_1 -d 10.255.0.0/16 -j REJECT --reject-with icmp-host-prohibited')
        const lastAccept = 'iptables -A AP_EG_FWD_1 -j ACCEPT'
        const rejectIdxs = chainRules.map((l, i) => (l.includes('REJECT') ? i : -1)).filter((i) => i >= 0)
        // the catch-all ACCEPT must come AFTER every REJECT, otherwise internal ranges would leak
        expect(chainRules.indexOf(lastAccept)).toBeGreaterThan(Math.max(...rejectIdxs))
    })

    it('carries NO conntrack state ACCEPT in the egress chain — it would override every REJECT below it', () => {
        // A state-based ACCEPT here would sit above every REJECT and let a conntrack helper reach metadata.
        const chainRules = lines.filter((l) => l.startsWith('iptables -A AP_EG_FWD_1'))
        expect(chainRules.some((l) => l.includes('conntrack'))).toBe(false)
    })

    it('INSERTS the FORWARD jump at the top, pinned to the box interface + source, so a pre-existing ACCEPT cannot bypass the chain', () => {
        expect(lines).toContain('iptables -I FORWARD 1 -i ap-veth-h1 -s 10.255.0.4/30 -j AP_EG_FWD_1')
        // must not append — an appended jump runs after any earlier ACCEPT (Docker/CNI/ops)
        expect(lines.some((l) => l.startsWith('iptables -A FORWARD '))).toBe(false)
    })

    it('DROPs spoofed source: any packet from the box interface whose source is not the box /30', () => {
        expect(lines).toContain('iptables -I FORWARD 1 -i ap-veth-h1 ! -s 10.255.0.4/30 -j DROP')
    })

    it('admits established reply traffic on the box veth independent of the ambient FORWARD policy', () => {
        // Replies are -d subnet and skip the egress jump, so without this they hang under FORWARD DROP.
        expect(lines).toContain('iptables -I FORWARD 1 -o ap-veth-h1 -m conntrack --ctstate ESTABLISHED -j ACCEPT')
    })

    it('admits RELATED replies only for ICMP, so PMTUD survives but helper expectations cannot open a port', () => {
        // RELATED is ICMP-only: widening it lets a conntrack helper open an inbound expectation.
        expect(lines).toContain('iptables -I FORWARD 1 -o ap-veth-h1 -p icmp -m conntrack --ctstate RELATED -j ACCEPT')
        expect(lines.some((l) => l.includes('--ctstate ESTABLISHED,RELATED'))).toBe(false)
    })

    it('lets the box reach ONLY its own gateway IP + WS-RPC port via a per-box INPUT chain, dropping other host services', () => {
        const rpcPort = sandboxCapacity.wsRpcPortForBox(1)
        // ACCEPT is pinned to the gateway IP (-d) and port, inside a per-box chain above the catch-all DROP
        expect(lines).toContain(`iptables -A AP_EG_IN_1 -d 10.255.0.5 -p tcp --dport ${rpcPort} -j ACCEPT`)
        expect(lines).toContain('iptables -A AP_EG_IN_1 -j DROP')
        expect(lines).toContain('iptables -I INPUT 1 -i ap-veth-h1 -j AP_EG_IN_1')
        // hostNetwork / shared-netns: drop anything to the gateway that did not arrive on the box veth
        expect(lines).toContain('iptables -I INPUT 1 ! -i ap-veth-h1 -d 10.255.0.5 -j DROP')
        // Both are top-inserted so they sit above any ambient ACCEPT; neither may be appended.
        expect(lines.filter((l) => l.startsWith('iptables -I INPUT 1 ')).length).toBe(2)
        // the jump goes through the chain — no ad-hoc rules appended straight to INPUT
        expect(lines.some((l) => l.startsWith('iptables -A INPUT '))).toBe(false)
    })

    it('does NOT open an app callback port when none is given (no loopback rewrite)', () => {
        expect(lines.some((l) => l.includes('AP_EG_IN_1') && l.includes('ACCEPT') && !l.includes(String(sandboxCapacity.wsRpcPortForBox(1))))).toBe(false)
    })

    it('opens the app callback port in the INPUT chain, above the DROP, when one is passed', () => {
        const withCallback = flat(egressNetnsInternals.buildCreateCommands(t, { callbackPort: 3000 }))
        const accept = 'iptables -A AP_EG_IN_1 -d 10.255.0.5 -p tcp --dport 3000 -j ACCEPT'
        const drop = 'iptables -A AP_EG_IN_1 -j DROP'
        expect(withCallback).toContain(accept)
        expect(withCallback.indexOf(accept)).toBeLessThan(withCallback.indexOf(drop))
    })

    it('ACCEPTs operator allow-list CIDRs ABOVE the blocked-range REJECTs (so an allowed internal host is reachable)', () => {
        const withAllow = flat(egressNetnsInternals.buildCreateCommands(t, { allowCidrs: ['10.9.9.9/32', '172.30.0.0/16'] }))
        const allowRule = 'iptables -A AP_EG_FWD_1 -d 10.9.9.9/32 -j ACCEPT'
        const firstBlockedReject = withAllow.findIndex((l) => l.startsWith('iptables -A AP_EG_FWD_1 -d 10.0.0.0/8 -j REJECT'))
        expect(withAllow).toContain(allowRule)
        expect(withAllow).toContain('iptables -A AP_EG_FWD_1 -d 172.30.0.0/16 -j ACCEPT')
        expect(withAllow.indexOf(allowRule)).toBeLessThan(firstBlockedReject)
    })

    it('ACCEPTs auto API endpoints port-scoped (not all ports on the API host)', () => {
        const withApi = flat(egressNetnsInternals.buildCreateCommands(t, {
            apiAllowEndpoints: [{ ip: '10.96.0.10', port: 3000, cidr: '10.96.0.10/32' }],
        }))
        expect(withApi).toContain('iptables -A AP_EG_FWD_1 -d 10.96.0.10/32 -p tcp --dport 3000 -j ACCEPT')
        expect(withApi).not.toContain('iptables -A AP_EG_FWD_1 -d 10.96.0.10/32 -j ACCEPT')
    })

    it('REJECTs the whole egress pool ABOVE the allow-list (cross-tenant box↔box isolation, even if allow-listed)', () => {
        const withAllow = flat(egressNetnsInternals.buildCreateCommands(t, { allowCidrs: ['10.0.0.0/8'] }))
        const poolReject = 'iptables -A AP_EG_FWD_1 -d 10.255.0.0/16 -j REJECT --reject-with icmp-host-prohibited'
        const allow = 'iptables -A AP_EG_FWD_1 -d 10.0.0.0/8 -j ACCEPT'
        expect(withAllow).toContain(poolReject)
        expect(withAllow.indexOf(poolReject)).toBeLessThan(withAllow.indexOf(allow))
    })
})

describe('egressNetnsInternals.resolveCallbackRewrite', () => {
    it('rewrites a host-loopback internalApiUrl to the gateway IP, keeping port + path', () => {
        expect(egressNetnsInternals.resolveCallbackRewrite({ internalApiUrl: 'http://127.0.0.1:3000/api/', gatewayHost: '10.255.0.5' }))
            .toEqual({ port: 3000, url: 'http://10.255.0.5:3000/api/' })
    })

    it('treats localhost and ::1 as loopback', () => {
        expect(egressNetnsInternals.resolveCallbackRewrite({ internalApiUrl: 'http://localhost:8080/api/', gatewayHost: '10.255.0.5' }))
            .toEqual({ port: 8080, url: 'http://10.255.0.5:8080/api/' })
        expect(egressNetnsInternals.resolveCallbackRewrite({ internalApiUrl: 'http://[::1]:8080/api/', gatewayHost: '10.255.0.5' })?.url)
            .toBe('http://10.255.0.5:8080/api/')
    })

    it('defaults the port from the protocol when the URL omits it', () => {
        expect(egressNetnsInternals.resolveCallbackRewrite({ internalApiUrl: 'http://127.0.0.1/api/', gatewayHost: '10.255.0.5' })?.port).toBe(80)
        expect(egressNetnsInternals.resolveCallbackRewrite({ internalApiUrl: 'https://127.0.0.1/api/', gatewayHost: '10.255.0.5' })?.port).toBe(443)
    })

    it('returns null for a NON-loopback URL (remote rewrite is resolveApiEgress)', () => {
        expect(egressNetnsInternals.resolveCallbackRewrite({ internalApiUrl: 'https://app.example.com/api/', gatewayHost: '10.255.0.5' })).toBeNull()
        expect(egressNetnsInternals.resolveCallbackRewrite({ internalApiUrl: 'http://10.0.0.9:3000/api/', gatewayHost: '10.255.0.5' })).toBeNull()
    })

    it('returns null for an unparseable URL rather than throwing', () => {
        expect(egressNetnsInternals.resolveCallbackRewrite({ internalApiUrl: 'not a url', gatewayHost: '10.255.0.5' })).toBeNull()
    })
})

describe('egressNetnsInternals.resolveApiEgress', () => {
    const log = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }

    beforeEach(() => {
        log.info.mockClear()
        log.warn.mockClear()
        log.error.mockClear()
        log.debug.mockClear()
        vi.restoreAllMocks()
    })

    it('returns empty for missing URL or loopback (INPUT punch / loopback rewrite path)', async () => {
        expect(await egressNetnsInternals.resolveApiEgress({ internalApiUrl: undefined, log })).toEqual({
            endpoints: [],
            pinHostname: null,
            fingerprint: '',
        })
        expect(await egressNetnsInternals.resolveApiEgress({ internalApiUrl: 'http://127.0.0.1:3000/api/', log })).toEqual({
            endpoints: [],
            pinHostname: null,
            fingerprint: '',
        })
        expect(await egressNetnsInternals.resolveApiEgress({ internalApiUrl: 'http://localhost:3000/api/', log })).toEqual({
            endpoints: [],
            pinHostname: null,
            fingerprint: '',
        })
    })

    it('needs NO host pin for a private IPv4 literal API URL (nothing to resolve) but still port-scopes it', async () => {
        expect(await egressNetnsInternals.resolveApiEgress({ internalApiUrl: 'http://10.0.0.9:3000/api/', log }))
            .toEqual({
                endpoints: [{ ip: '10.0.0.9', port: 3000, cidr: '10.0.0.9/32' }],
                pinHostname: null,
                fingerprint: '10.0.0.9:3000',
            })
    })

    it('resolves a hostname to EVERY IPv4 endpoint and pins the NAME, never rewriting it to an address', async () => {
        vi.spyOn(dns.promises, 'lookup').mockResolvedValue([
            { address: '10.96.0.10', family: 4 },
            { address: '10.96.0.11', family: 4 },
        ] as never)
        expect(await egressNetnsInternals.resolveApiEgress({ internalApiUrl: 'http://api.default.svc/api/', log }))
            .toEqual({
                endpoints: [
                    { ip: '10.96.0.10', port: 80, cidr: '10.96.0.10/32' },
                    { ip: '10.96.0.11', port: 80, cidr: '10.96.0.11/32' },
                ],
                pinHostname: 'api.default.svc',
                fingerprint: '10.96.0.10:80,10.96.0.11:80',
            })
    })

    // Rewriting the hostname to an address dropped SNI and failed the handshake on every https app URL.
    it('leaves an https hostname URL completely untouched (no address ever replaces the name)', async () => {
        vi.spyOn(dns.promises, 'lookup').mockResolvedValue([
            { address: '104.21.83.205', family: 4 },
            { address: '172.67.181.76', family: 4 },
        ] as never)
        const resolution = await egressNetnsInternals.resolveApiEgress({ internalApiUrl: 'https://app.example.com/api/', log })
        expect(resolution.pinHostname).toBe('app.example.com')
        expect(JSON.stringify(resolution)).not.toContain('https://104.21.83.205')
        expect(resolution.endpoints.map((endpoint) => `${endpoint.ip}:${endpoint.port}`))
            .toEqual(['104.21.83.205:443', '172.67.181.76:443'])
    })

    it('returns a port-scoped endpoint for a public IPv4 literal', async () => {
        expect(await egressNetnsInternals.resolveApiEgress({ internalApiUrl: 'https://203.0.113.50/api/', log }))
            .toEqual({
                endpoints: [{ ip: '203.0.113.50', port: 443, cidr: '203.0.113.50/32' }],
                pinHostname: null,
                fingerprint: '203.0.113.50:443',
            })
    })

    // Rejected by the WHATWG URL host parser, not the IPv4 guard, which is why that guard is IPv6-only.
    it('rejects a dotted-quad host whose octets are out of range', async () => {
        await expect(egressNetnsInternals.resolveApiEgress({ internalApiUrl: 'http://999.1.1.1:3000/api/', log }))
            .rejects.toThrow(/is not a valid URL/)
    })

    it('rejects a non-loopback IPv6 host (no v6 egress exists inside the box)', async () => {
        await expect(egressNetnsInternals.resolveApiEgress({ internalApiUrl: 'http://[2001:db8::1]:3000/api/', log }))
            .rejects.toThrow(/not a usable IPv4 address/)
    })

    it.each(['http://2130706433:3000/api/', 'http://0x7f000001:3000/api/'])(
        'treats a decimal/hex-encoded loopback host as loopback, not as an egress endpoint (%s)',
        async (internalApiUrl) => {
            expect(await egressNetnsInternals.resolveApiEgress({ internalApiUrl, log }))
                .toEqual({ endpoints: [], pinHostname: null, fingerprint: '' })
        },
    )

    it('fails closed when DNS yields no usable IPv4 (all forbidden or empty)', async () => {
        vi.spyOn(dns.promises, 'lookup').mockResolvedValue([
            { address: '169.254.169.254', family: 4 },
        ] as never)
        await expect(egressNetnsInternals.resolveApiEgress({ internalApiUrl: 'http://meta.internal/api/', log }))
            .rejects.toThrow(/no usable IPv4/)
    })

    it('fails closed when DNS lookup fails', async () => {
        vi.spyOn(dns.promises, 'lookup').mockRejectedValue(new Error('ENOTFOUND'))
        await expect(egressNetnsInternals.resolveApiEgress({ internalApiUrl: 'http://missing.example/api/', log }))
            .rejects.toThrow(/cannot resolve/)
    })
})

describe('egressNetnsInternals.serializePerBox', () => {
    const delayed = (order: string[], label: string, ms: number) => () =>
        new Promise<void>((resolve) => setTimeout(() => { order.push(label); resolve() }, ms))

    it('runs operations for the SAME box strictly in order, even when a later one is faster', async () => {
        const order: string[] = []
        await Promise.all([
            egressNetnsInternals.serializePerBox(1, delayed(order, 'first', 20)),
            egressNetnsInternals.serializePerBox(1, delayed(order, 'second', 1)),
        ])
        expect(order).toEqual(['first', 'second'])
    })

    it('does not block a rejected op from letting the next same-box op run (chain survives errors)', async () => {
        const order: string[] = []
        await egressNetnsInternals.serializePerBox(2, () => Promise.reject(new Error('boom'))).catch(() => undefined)
        await egressNetnsInternals.serializePerBox(2, delayed(order, 'after-failure', 1))
        expect(order).toEqual(['after-failure'])
    })

    it('lets different boxes run concurrently', async () => {
        const order: string[] = []
        await Promise.all([
            egressNetnsInternals.serializePerBox(3, delayed(order, 'slow-box3', 20)),
            egressNetnsInternals.serializePerBox(4, delayed(order, 'fast-box4', 1)),
        ])
        expect(order).toEqual(['fast-box4', 'slow-box3'])
    })
})

describe('egressNetnsInternals.parseNetnsBoxIds', () => {
    it('extracts boxIds from `ip netns list`, ignoring non-egress namespaces', () => {
        const listing = ['ap-egress-1 (id: 0)', 'ap-egress-42', 'some-other-ns (id: 3)', 'ap-egress-7 (id: 1)', ''].join('\n')
        expect(egressNetnsInternals.parseNetnsBoxIds(listing).sort((a, b) => a - b)).toEqual([1, 7, 42])
    })

    it('returns empty when there are no egress namespaces', () => {
        expect(egressNetnsInternals.parseNetnsBoxIds('lo\ndefault (id: 0)')).toEqual([])
    })

    it('does not match lookalikes (ap-egress-foo, prefixed, or no id)', () => {
        expect(egressNetnsInternals.parseNetnsBoxIds('ap-egress-foo\nxap-egress-1\nap-egress-')).toEqual([])
    })
})

describe('egressNetnsInternals.buildDestroyCommands', () => {
    const t = egressNetnsInternals.buildTopology(1)
    const lines = flat(egressNetnsInternals.buildDestroyCommands(t))

    it('removes every resource (veth, netns, chains, nat, jumps)', () => {
        expect(lines).toContain('ip link set ap-veth-h1 down')
        expect(lines).toContain('ip netns del ap-egress-1')
        expect(lines).toContain('ip link del ap-veth-h1')
        expect(lines).toContain('iptables -X AP_EG_FWD_1')
        expect(lines).toContain('iptables -X AP_EG_IN_1')
        expect(lines).toContain('iptables -D INPUT ! -i ap-veth-h1 -d 10.255.0.5 -j DROP')
        expect(lines).toContain('iptables -D FORWARD -i ap-veth-h1 -s 10.255.0.4/30 -j AP_EG_FWD_1')
        expect(lines).toContain('iptables -D FORWARD -o ap-veth-h1 -m conntrack --ctstate ESTABLISHED -j ACCEPT')
        expect(lines).toContain('iptables -D FORWARD -o ap-veth-h1 -p icmp -m conntrack --ctstate RELATED -j ACCEPT')
        expect(lines).toContain('iptables -D FORWARD -i ap-veth-h1 ! -s 10.255.0.4/30 -j DROP')
        expect(lines).toContain('iptables -t nat -D POSTROUTING -s 10.255.0.4/30 ! -o ap-veth-h1 -j MASQUERADE')
    })

    // Rules in SHARED chains are removed by exact spec, so an unmirrored create leaves one armed forever.
    it('is an exact inverse of buildCreateCommands for every shared-chain rule (-I must have a matching -D)', () => {
        const spec = (line: string, flag: '-I' | '-D'): string | null => {
            const match = line.match(new RegExp(`^iptables (-t \\w+ )?\\${flag} (FORWARD|INPUT|POSTROUTING) (?:1 )?(.+)$`))
            return match ? `${match[1] ?? ''}${match[2]} ${match[3]}` : null
        }
        const created = flat(egressNetnsInternals.buildCreateCommands(t, {
            callbackPort: 3000,
            allowCidrs: ['10.9.0.0/24'],
            apiAllowEndpoints: [{ ip: '10.8.0.1', port: 443, cidr: '10.8.0.1/32' }],
            mtu: 1450,
        })).map((l) => spec(l, '-I')).filter((s): s is string => s !== null)
        const removed = flat(egressNetnsInternals.buildDestroyCommands(t)).map((l) => spec(l, '-D')).filter((s): s is string => s !== null)

        expect(created.length).toBeGreaterThan(0)
        expect([...created].sort()).toEqual([...removed].sort())
    })

    it('FAILS CLOSED: severs the egress path (veth down, netns/veth deleted) BEFORE removing host filter rules', () => {
        const vethDown = lines.indexOf('ip link set ap-veth-h1 down')
        const netnsDel = lines.indexOf('ip netns del ap-egress-1')
        const vethDel = lines.indexOf('ip link del ap-veth-h1')
        const firstHostRuleRemoval = lines.findIndex((l) => l.startsWith('iptables -D') || l.startsWith('iptables -F') || l.startsWith('iptables -X'))
        expect(vethDown).toBeLessThan(netnsDel)
        expect(vethDel).toBeLessThan(firstHostRuleRemoval)
    })
})

describe('BLOCKED_CIDRS parity with ssrfIpClassifier (kernel list must not drift from the in-process guard)', () => {
    const representativeIps: Record<string, string> = {
        '0.0.0.0/8': '0.1.2.3',
        '10.0.0.0/8': '10.1.2.3',
        '100.64.0.0/10': '100.100.100.200',
        '127.0.0.0/8': '127.0.0.1',
        '169.254.0.0/16': '169.254.169.254',
        '172.16.0.0/12': '172.16.5.5',
        '192.0.0.0/24': '192.0.0.192',
        '192.0.2.0/24': '192.0.2.5',
        '192.88.99.0/24': '192.88.99.1',
        '192.168.0.0/16': '192.168.1.1',
        '198.18.0.0/15': '198.18.0.1',
        '198.51.100.0/24': '198.51.100.5',
        '203.0.113.0/24': '203.0.113.5',
        '224.0.0.0/4': '239.1.2.3',
        '240.0.0.0/4': '255.255.255.255',
    }

    it('covers exactly the ranges enumerated (kept in sync with the representative-IP map)', () => {
        expect([...egressNetnsInternals.BLOCKED_CIDRS].sort()).toEqual(Object.keys(representativeIps).sort())
    })

    it('ssrfIpClassifier.isBlockedIp is true for a representative IP in every kernel-blocked CIDR', () => {
        for (const [cidr, ip] of Object.entries(representativeIps)) {
            expect(ssrfIpClassifier.isBlockedIp({ ip, allowList: [] }), `${ip} (${cidr})`).toBe(true)
        }
    })

    it('a public unicast IP is NOT in any kernel-blocked CIDR (and the classifier agrees)', () => {
        const publicIp = '93.184.216.34'
        expect([...egressNetnsInternals.BLOCKED_CIDRS].some((cidr) => {
            const range = egressNetnsInternals.cidrToRange(cidr)
            const ipRange = egressNetnsInternals.cidrToRange(`${publicIp}/32`)
            return range !== null && ipRange !== null && egressNetnsInternals.rangesOverlap(range, ipRange)
        })).toBe(false)
        expect(ssrfIpClassifier.isBlockedIp({ ip: publicIp, allowList: [] })).toBe(false)
    })
})

describe('egressNetnsInternals.toKernelAllowCidrs', () => {
    const log = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }

    beforeEach(() => {
        log.info.mockClear()
        log.warn.mockClear()
        log.error.mockClear()
        log.debug.mockClear()
    })

    it('keeps IPv4 literals (as /32) and RFC1918 CIDRs; drops IPv6 with a warn', () => {
        expect(egressNetnsInternals.toKernelAllowCidrs({
            allowList: ['10.9.9.9', '172.30.0.0/16', 'fd00::1', '2001:db8::/32'],
            log,
        })).toEqual(['10.9.9.9/32', '172.30.0.0/16'])
        expect(log.warn).toHaveBeenCalled()
    })

    it('DROPS hostnames with an error log (kernel cannot pin names) but keeps valid IPs — never throws', () => {
        expect(egressNetnsInternals.toKernelAllowCidrs({
            allowList: ['10.9.9.9', 'db.internal'],
            log,
        })).toEqual(['10.9.9.9/32'])
        expect(log.error).toHaveBeenCalled()
    })

    it('drops metadata/link-local, CGNAT (Alibaba), and 0.0.0.0/8 (incl. 0.0.0.0/0) with an error log; keeps RFC1918', () => {
        expect(egressNetnsInternals.toKernelAllowCidrs({
            allowList: [
                '169.254.169.254',
                '169.254.0.0/16',
                '100.100.100.200',
                '100.64.0.0/10',
                '0.0.0.0/0',
                '0.0.0.0/8',
                '0.1.2.3',
                '10.9.9.9/32',
                '192.168.1.0/24',
            ],
            log,
        })).toEqual(['10.9.9.9/32', '192.168.1.0/24'])
        expect(log.error).toHaveBeenCalled()
        expect(log.error.mock.calls.some((call) => String(call[1]).includes('metadata/link-local/CGNAT'))).toBe(true)
    })

    it('rejects malformed IPs/prefixes and dedupes', () => {
        expect(egressNetnsInternals.toKernelAllowCidrs({
            allowList: ['999.1.1.1', '10.0.0.1/33', '10.0.0.1/8', '10.0.0.1/8'],
            log,
        })).toEqual(['10.0.0.1/8'])
    })
})

describe('egressNetnsInternals.withXtablesWait', () => {
    it('prepends a bounded --wait (below the process timeout) to host iptables commands only', () => {
        expect(egressNetnsInternals.withXtablesWait({ binary: 'iptables', args: ['-N', 'AP_EG_FWD_1'] }))
            .toEqual({ binary: 'iptables', args: ['--wait', '3', '-N', 'AP_EG_FWD_1'] })
    })

    it('leaves ip / in-netns commands untouched', () => {
        expect(egressNetnsInternals.withXtablesWait({ binary: 'ip', args: ['netns', 'add', 'ap-egress-1'] }))
            .toEqual({ binary: 'ip', args: ['netns', 'add', 'ap-egress-1'] })
    })
})

describe('egressNetnsInternals subnet config + host-overlap', () => {
    it('parses a valid /16 override and rejects non-/16 or non-zero-tail values', () => {
        expect(egressNetnsInternals.parseSlash16('172.30.0.0/16')).toEqual({ prefix: '172.30', cidr: '172.30.0.0/16' })
        expect(egressNetnsInternals.parseSlash16('10.255.0.0/24')).toBeNull()
        expect(egressNetnsInternals.parseSlash16('10.255.1.0/16')).toBeNull()
        expect(egressNetnsInternals.parseSlash16('999.0.0.0/16')).toBeNull()
    })

    it('carves the box /30 from a configured base prefix', () => {
        const t = egressNetnsInternals.buildTopology(1, { prefix: '172.30', cidr: '172.30.0.0/16' })
        expect(t.gatewayHost).toBe('172.30.0.5')
        expect(t.boxHost).toBe('172.30.0.6')
        expect(t.subnetCidr).toBe('172.30.0.4/30')
    })

    it('detects overlap between the egress /16 and host networks, excluding our own ap-veth addresses', () => {
        const ours = egressNetnsInternals.cidrToRange('10.255.0.0/16')!
        const hostCidrs = egressNetnsInternals.parseHostCidrs({
            addrOutput: [
                '2: eth0    inet 10.255.4.2/24 scope global eth0',       // a real host network inside our /16 → overlap
                '9: ap-veth-h1    inet 10.255.0.5/30 scope global ap-veth-h1', // our own veth → excluded
            ].join('\n'),
            routeOutput: '10.0.0.0/24 dev eth0 proto kernel scope link',
        })
        expect(hostCidrs).toContain('10.255.4.2/24')
        expect(hostCidrs).not.toContain('10.255.0.5/30')
        expect(hostCidrs.some((c) => egressNetnsInternals.rangesOverlap(ours, egressNetnsInternals.cidrToRange(c)!))).toBe(true)
    })

    it('no overlap when host networks are disjoint from the egress /16', () => {
        const ours = egressNetnsInternals.cidrToRange('10.255.0.0/16')!
        const hostCidrs = egressNetnsInternals.parseHostCidrs({ addrOutput: '2: eth0 inet 192.168.1.10/24 scope global eth0', routeOutput: 'default via 192.168.1.1 dev eth0' })
        expect(hostCidrs.some((c) => egressNetnsInternals.rangesOverlap(ours, egressNetnsInternals.cidrToRange(c)!))).toBe(false)
    })

    it('parseHostAddresses captures route next-hops and UNMASKED interface addresses (excluding our veth)', () => {
        const addresses = egressNetnsInternals.parseHostAddresses({
            addrOutput: [
                '2: eth0    inet 10.255.0.7/8 scope global eth0',              // wide mask hides it from the subset CIDR test
                '9: ap-veth-h1    inet 10.255.0.5/30 scope global ap-veth-h1', // ours → excluded
            ].join('\n'),
            routeOutput: 'default via 10.255.0.1 dev eth0',                    // next-hop inside the pool
        })
        expect(addresses).toContain('10.255.0.7') // unmasked address, not 10.0.0.0/8
        expect(addresses).toContain('10.255.0.1') // next-hop
        expect(addresses).not.toContain('10.255.0.5') // our own veth excluded
    })
})

describe('egressNetnsInternals.parseResourceBoxIds', () => {
    it('extracts boxIds from veth links and iptables chains (union with netns for the sweep)', () => {
        const listing = [
            '9: ap-veth-h2@if8: <BROADCAST> mtu 1500',
            '-N AP_EG_FWD_5',
            '-A AP_EG_IN_5 -j DROP',
            'lo unrelated',
        ].join('\n')
        expect(egressNetnsInternals.parseResourceBoxIds(listing).sort((a, b) => a - b)).toEqual([2, 5])
    })
})
