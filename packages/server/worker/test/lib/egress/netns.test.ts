import { ApLogger } from '@activepieces/server-utils'
import { ActivepiecesError } from '@activepieces/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'

const spawnWithKill = vi.fn<(args: { cmd: string, args: string[], timeoutMs: number }) => Promise<{ stdout: string, stderr: string }>>()

vi.mock('../../../src/lib/utils/exec', () => ({
    spawnWithKill: (args: { cmd: string, args: string[], timeoutMs: number }) => spawnWithKill(args),
}))

import { egressNetns, egressNetnsInternals } from '../../../src/lib/egress/netns'

const noop = () => undefined
const log: ApLogger = {
    get level() { return 'silent' },
    set level(_v) { /* no-op */ },
    silent: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
    debug: noop,
    trace: noop,
    child() { return log },
}

function callArgsLine(call: { cmd: string, args: string[] }): string {
    return `${call.cmd} ${call.args.join(' ')}`
}

async function captureRejection(fn: () => Promise<unknown>): Promise<{ rejection: unknown }> {
    try {
        await fn()
        return { rejection: undefined }
    }
    catch (rejection) {
        return { rejection }
    }
}

describe('egressNetns.create — fail-loud + rollback', () => {
    afterEach(() => {
        spawnWithKill.mockReset()
    })

    it('throws ActivepiecesError when the `ip` binary is unavailable (does NOT silently no-op)', async () => {
        // `ip -V` (assertIpAvailable) is the very first call; reject it to simulate a missing binary.
        spawnWithKill.mockImplementation(async ({ args }) => {
            if (args[0] === '-V') throw new Error('spawn ip ENOENT')
            return { stdout: '', stderr: '' }
        })

        const { rejection } = await captureRejection(() => egressNetns.create({ log }))
        expect(rejection).toBeInstanceOf(ActivepiecesError)
        expect((rejection as Error).message).toMatch(/iproute2 "ip" binary not available/)
    })

    it('throws ActivepiecesError AND rolls back (runs destroy commands) when a create step fails', async () => {
        spawnWithKill.mockImplementation(async ({ args }) => {
            // assertIpAvailable + preflightCleanup pass; fail the first real create step (netns add).
            if (args[0] === '-V') return { stdout: '', stderr: '' }
            if (args[0] === 'netns' && args[1] === 'add') throw new Error('RTNETLINK answers: Operation not permitted')
            return { stdout: '', stderr: '' }
        })

        await expect(egressNetns.create({ log })).rejects.toBeInstanceOf(ActivepiecesError)

        const lines = spawnWithKill.mock.calls.map((c) => callArgsLine(c[0]))
        // Rollback must have torn down both the netns and the host veth after the failure.
        expect(lines).toContain('ip netns del ap-egress')
        expect(lines).toContain('ip link del ap-veth-host')
    })

    it('returns a working namespace + destroy handle on the happy path', async () => {
        spawnWithKill.mockResolvedValue({ stdout: '', stderr: '' })

        const ns = await egressNetns.create({ log })
        expect(ns.netnsName).toBe('ap-egress')
        expect(ns.gatewayHost).toBe('10.255.0.1')

        const createLines = spawnWithKill.mock.calls.map((c) => callArgsLine(c[0]))
        expect(createLines).toContain('ip netns add ap-egress')

        spawnWithKill.mockClear()
        await ns.destroy()
        const destroyLines = spawnWithKill.mock.calls.map((c) => callArgsLine(c[0]))
        expect(destroyLines).toEqual(['ip netns del ap-egress', 'ip link del ap-veth-host'])
    })
})

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
