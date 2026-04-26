import { describe, it, expect } from 'vitest'
import { iptablesLockdown } from '../../../src/lib/egress/iptables-lockdown'

const log = { info: () => undefined, warn: () => undefined, error: () => undefined, debug: () => undefined } as never

describe('iptables-lockdown command builder', () => {
    const baseParams = {
        proxyPort: 4444,
        wsRpcPortRange: { first: 52000, last: 52999 },
        firstBoxUid: 60000,
        numBoxes: 10,
        nameservers: [] as string[],
        log,
    }

    it('apply commands start with chain creation and end with jump rule', () => {
        const cmds = iptablesLockdown.buildApplyCommands(baseParams)
        expect(cmds[0]).toEqual(['-N', 'AP_EGRESS_LOCKDOWN'])
        const last = cmds[cmds.length - 1]
        expect(last).toEqual(['-A', 'OUTPUT', '-m', 'owner', '--uid-owner', '60000-60009', '-j', 'AP_EGRESS_LOCKDOWN'])
    })

    it('apply commands allowlist the proxy port exactly once', () => {
        const cmds = iptablesLockdown.buildApplyCommands(baseParams)
        const matches = cmds.filter((c) => c.includes('--dport') && c[c.indexOf('--dport') + 1] === '4444')
        expect(matches.length).toBe(1)
        expect(matches[0]).toEqual(['-A', 'AP_EGRESS_LOCKDOWN', '-o', 'lo', '-p', 'tcp', '--dport', '4444', '-j', 'ACCEPT'])
    })

    it('apply commands allowlist the WS RPC port range with a single rule', () => {
        const cmds = iptablesLockdown.buildApplyCommands(baseParams)
        const rangeRules = cmds.filter((c) => c[c.indexOf('--dport') + 1] === '52000:52999')
        expect(rangeRules).toHaveLength(1)
        expect(rangeRules[0]).toEqual(['-A', 'AP_EGRESS_LOCKDOWN', '-o', 'lo', '-p', 'tcp', '--dport', '52000:52999', '-j', 'ACCEPT'])
    })

    it('apply commands end the chain with a REJECT rule before the jump', () => {
        const cmds = iptablesLockdown.buildApplyCommands(baseParams)
        const rejectIdx = cmds.findIndex((c) => c.includes('REJECT'))
        const jumpIdx = cmds.findIndex((c) => c[1] === 'OUTPUT')
        expect(rejectIdx).toBeGreaterThan(0)
        expect(rejectIdx).toBeLessThan(jumpIdx)
        expect(cmds[rejectIdx]).toEqual(['-A', 'AP_EGRESS_LOCKDOWN', '-j', 'REJECT', '--reject-with', 'icmp-host-prohibited'])
    })

    it('remove commands detach from OUTPUT before flushing + deleting the chain', () => {
        const cmds = iptablesLockdown.buildRemoveCommands(baseParams)
        expect(cmds).toEqual([
            ['-D', 'OUTPUT', '-m', 'owner', '--uid-owner', '60000-60009', '-j', 'AP_EGRESS_LOCKDOWN'],
            ['-F', 'AP_EGRESS_LOCKDOWN'],
            ['-X', 'AP_EGRESS_LOCKDOWN'],
        ])
    })

    it('uid range reflects numBoxes correctly (off-by-one)', () => {
        const cmds = iptablesLockdown.buildApplyCommands({ ...baseParams, firstBoxUid: 60000, numBoxes: 1 })
        const jump = cmds[cmds.length - 1]
        expect(jump).toEqual(['-A', 'OUTPUT', '-m', 'owner', '--uid-owner', '60000-60000', '-j', 'AP_EGRESS_LOCKDOWN'])
    })

    describe('DNS nameserver allow rules', () => {
        it('emits a UDP and a TCP /53 ACCEPT for a single IPv4 nameserver', () => {
            const cmds = iptablesLockdown.buildApplyCommands({ ...baseParams, nameservers: ['10.0.0.2'] })
            const udp = cmds.find((c) => c.includes('10.0.0.2') && c.includes('udp'))
            const tcp = cmds.find((c) => c.includes('10.0.0.2') && c.includes('tcp') && c.includes('--dport') && c[c.indexOf('--dport') + 1] === '53')
            expect(udp).toEqual(['-A', 'AP_EGRESS_LOCKDOWN', '-d', '10.0.0.2', '-p', 'udp', '--dport', '53', '-j', 'ACCEPT'])
            expect(tcp).toEqual(['-A', 'AP_EGRESS_LOCKDOWN', '-d', '10.0.0.2', '-p', 'tcp', '--dport', '53', '-j', 'ACCEPT'])
        })

        it('emits UDP+TCP /53 rules for each nameserver in input order', () => {
            const cmds = iptablesLockdown.buildApplyCommands({ ...baseParams, nameservers: ['10.0.0.2', '169.254.169.253'] })
            const dnsRules = cmds.filter((c) => c[0] === '-A' && c[1] === 'AP_EGRESS_LOCKDOWN' && c.includes('--dport') && c[c.indexOf('--dport') + 1] === '53')
            expect(dnsRules).toEqual([
                ['-A', 'AP_EGRESS_LOCKDOWN', '-d', '10.0.0.2', '-p', 'udp', '--dport', '53', '-j', 'ACCEPT'],
                ['-A', 'AP_EGRESS_LOCKDOWN', '-d', '10.0.0.2', '-p', 'tcp', '--dport', '53', '-j', 'ACCEPT'],
                ['-A', 'AP_EGRESS_LOCKDOWN', '-d', '169.254.169.253', '-p', 'udp', '--dport', '53', '-j', 'ACCEPT'],
                ['-A', 'AP_EGRESS_LOCKDOWN', '-d', '169.254.169.253', '-p', 'tcp', '--dport', '53', '-j', 'ACCEPT'],
            ])
        })

        it('omits all DNS rules when nameservers is empty', () => {
            const cmds = iptablesLockdown.buildApplyCommands({ ...baseParams, nameservers: [] })
            const dnsRules = cmds.filter((c) => c.includes('--dport') && c[c.indexOf('--dport') + 1] === '53')
            expect(dnsRules).toHaveLength(0)
        })

        it('places DNS rules after loopback ACCEPTs and strictly before the REJECT', () => {
            const cmds = iptablesLockdown.buildApplyCommands({ ...baseParams, nameservers: ['10.0.0.2'] })
            const lastLoopbackIdx = cmds.findLastIndex((c) => c.includes('-o') && c.includes('lo'))
            const firstDnsIdx = cmds.findIndex((c) => c.includes('--dport') && c[c.indexOf('--dport') + 1] === '53')
            const rejectIdx = cmds.findIndex((c) => c.includes('REJECT'))
            expect(firstDnsIdx).toBeGreaterThan(lastLoopbackIdx)
            expect(firstDnsIdx).toBeLessThan(rejectIdx)
        })

        it('IPv4 builder skips IPv6 nameservers', () => {
            const cmds = iptablesLockdown.buildApplyCommands({ ...baseParams, nameservers: ['10.0.0.2', 'fd00::1'] })
            const ipv6Rules = cmds.filter((c) => c.includes('fd00::1'))
            expect(ipv6Rules).toHaveLength(0)
            const ipv4Rules = cmds.filter((c) => c.includes('10.0.0.2'))
            expect(ipv4Rules).toHaveLength(2)
        })
    })
})
