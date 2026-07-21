import { describe, it, expect } from 'vitest'
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

    it('NATs the box /30 out the uplink (never back into its own veth)', () => {
        expect(lines).toContain('iptables -t nat -A POSTROUTING -s 10.255.0.4/30 ! -o ap-veth-h1 -j MASQUERADE')
    })

    it('REJECTs metadata, loopback and every RFC1918 range from the box', () => {
        for (const cidr of ['169.254.0.0/16', '127.0.0.0/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '100.64.0.0/10']) {
            expect(lines).toContain(`iptables -A AP_EG_FWD_1 -d ${cidr} -j REJECT --reject-with icmp-host-prohibited`)
        }
    })

    it('allows return traffic first and public egress last (order matters)', () => {
        const chainRules = lines.filter((l) => l.startsWith('iptables -A AP_EG_FWD_1'))
        expect(chainRules[0]).toBe('iptables -A AP_EG_FWD_1 -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT')
        const lastAccept = 'iptables -A AP_EG_FWD_1 -j ACCEPT'
        const rejectIdxs = chainRules.map((l, i) => (l.includes('REJECT') ? i : -1)).filter((i) => i >= 0)
        // the catch-all ACCEPT must come AFTER every REJECT, otherwise internal ranges would leak
        expect(chainRules.indexOf(lastAccept)).toBeGreaterThan(Math.max(...rejectIdxs))
    })

    it('routes the box /30 through the per-box chain from FORWARD', () => {
        expect(lines).toContain('iptables -A FORWARD -s 10.255.0.4/30 -j AP_EG_FWD_1')
    })

    it('lets the box reach ONLY the WS-RPC port on the gateway, dropping other host services', () => {
        const rpcPort = sandboxCapacity.wsRpcPortForBox(1)
        expect(lines).toContain(`iptables -A INPUT -i ap-veth-h1 -p tcp --dport ${rpcPort} -j ACCEPT`)
        const dropIdx = lines.indexOf('iptables -A INPUT -i ap-veth-h1 -j DROP')
        const acceptIdx = lines.indexOf(`iptables -A INPUT -i ap-veth-h1 -p tcp --dport ${rpcPort} -j ACCEPT`)
        expect(dropIdx).toBeGreaterThan(acceptIdx)
    })
})

describe('egressNetnsInternals.buildDestroyCommands', () => {
    const t = egressNetnsInternals.buildTopology(1)
    const lines = flat(egressNetnsInternals.buildDestroyCommands(t))

    it('is purely deletions (leaves no netns/veth/chain/nat behind)', () => {
        expect(lines).toContain('ip netns del ap-egress-1')
        expect(lines).toContain('ip link del ap-veth-h1')
        expect(lines).toContain('iptables -X AP_EG_FWD_1')
        expect(lines).toContain('iptables -D FORWARD -s 10.255.0.4/30 -j AP_EG_FWD_1')
        expect(lines).toContain('iptables -t nat -D POSTROUTING -s 10.255.0.4/30 ! -o ap-veth-h1 -j MASQUERADE')
        for (const l of lines) {
            expect(l).toMatch(/ (del|-D|-F|-X) /)
        }
    })
})
