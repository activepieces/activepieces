import { describe, expect, it } from 'vitest'
import { egressNetnsInternals } from '../../../src/lib/egress/netns'

describe('egress netns command builder', () => {
    it('creates the namespace, the veth pair, and brings up the /30 link in order', () => {
        const cmds = egressNetnsInternals.buildCreateCommands()
        expect(cmds).toEqual([
            ['netns', 'add', 'ap-egress'],
            ['link', 'add', 'ap-veth-host', 'type', 'veth', 'peer', 'name', 'ap-veth-box'],
            ['link', 'set', 'ap-veth-box', 'netns', 'ap-egress'],
            ['addr', 'add', '10.255.0.1/30', 'dev', 'ap-veth-host'],
            ['link', 'set', 'ap-veth-host', 'up'],
            ['netns', 'exec', 'ap-egress', 'ip', 'addr', 'add', '10.255.0.2/30', 'dev', 'ap-veth-box'],
            ['netns', 'exec', 'ap-egress', 'ip', 'link', 'set', 'ap-veth-box', 'up'],
            ['netns', 'exec', 'ap-egress', 'ip', 'link', 'set', 'lo', 'up'],
        ])
    })

    it('never adds a default route or NAT (egress is blocked by topology, not firewall)', () => {
        const flat = egressNetnsInternals.buildCreateCommands().map((c) => c.join(' '))
        expect(flat.some((c) => c.includes('default'))).toBe(false)
        expect(flat.some((c) => c.includes('route'))).toBe(false)
        expect(flat.some((c) => c.includes('nat') || c.includes('MASQUERADE'))).toBe(false)
    })

    it('assigns the gateway to the host side and the box address inside the namespace', () => {
        const cmds = egressNetnsInternals.buildCreateCommands()
        const gatewayCmd = cmds.find((c) => c.includes('10.255.0.1/30'))
        const boxCmd = cmds.find((c) => c.includes('10.255.0.2/30'))
        expect(gatewayCmd).toEqual(['addr', 'add', '10.255.0.1/30', 'dev', 'ap-veth-host'])
        expect(boxCmd?.slice(0, 4)).toEqual(['netns', 'exec', 'ap-egress', 'ip'])
        expect(boxCmd).toContain('ap-veth-box')
    })

    it('destroys the namespace before the host veth (netns del auto-removes the box peer)', () => {
        const cmds = egressNetnsInternals.buildDestroyCommands()
        expect(cmds).toEqual([
            ['netns', 'del', 'ap-egress'],
            ['link', 'del', 'ap-veth-host'],
        ])
    })
})
