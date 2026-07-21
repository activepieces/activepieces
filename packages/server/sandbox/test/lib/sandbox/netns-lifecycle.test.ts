import { describe, it, expect, vi, beforeEach } from 'vitest'

const { spawnWithKillMock, writeFileMock, readFileMock, statMock } = vi.hoisted(() => ({
    spawnWithKillMock: vi.fn(),
    writeFileMock: vi.fn(),
    readFileMock: vi.fn(),
    statMock: vi.fn(),
}))

vi.mock('../../../src/lib/utils/exec', () => ({
    spawnWithKill: spawnWithKillMock,
}))

vi.mock('node:fs/promises', () => ({
    writeFile: writeFileMock,
    readFile: readFileMock,
    stat: statMock,
}))

import { acquireEgressNetworkLease, createEgressNetns, cleanupStaleEgress, assertEgressCapabilities, prepareEgressEnvironment, egressNetnsInternals } from '../../../src/lib/sandbox/netns'
import { SandboxLogger } from '../../../src/lib/sandbox/types'

// Both stats default to the SAME (dev, ino) so the kill path runs; a test wanting a refusal overrides one.
const SAME_NETNS = { dev: 4, ino: 4026532001 }

function mkLog(): SandboxLogger {
    return { info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn() }
}

function ranCommands(): string[] {
    return spawnWithKillMock.mock.calls.map(([o]) => `${o.cmd} ${o.args.join(' ')}`)
}

type Cmd = { cmd: string, args: string[] }

// Reject only the commands a test is about; everything else succeeds so the path under test still runs.
function denyCommand(matches: (c: Cmd) => boolean, message = 'Operation not permitted'): void {
    spawnWithKillMock.mockImplementation((opts: Cmd) =>
        matches(opts) ? Promise.reject(new Error(message)) : Promise.resolve({ stdout: '', stderr: '' }))
}

// Give one exact command a canned stdout (or a rejection); every other command succeeds empty.
function stubCommand(command: string, result: string | Error): void {
    spawnWithKillMock.mockImplementation((opts: Cmd) => {
        if (`${opts.cmd} ${opts.args.join(' ')}` !== command) {
            return Promise.resolve({ stdout: '', stderr: '' })
        }
        return result instanceof Error ? Promise.reject(result) : Promise.resolve({ stdout: result, stderr: '' })
    })
}

describe('createEgressNetns lifecycle', () => {
    beforeEach(() => {
        spawnWithKillMock.mockReset()
        writeFileMock.mockReset()
        readFileMock.mockReset()
        spawnWithKillMock.mockResolvedValue({ stdout: '', stderr: '' })
        writeFileMock.mockResolvedValue(undefined)
        readFileMock.mockResolvedValue('1') // ip_forward reads back as enabled
        statMock.mockReset()
        statMock.mockResolvedValue(SAME_NETNS)
        egressNetnsInternals.resetStateForTests()
        vi.spyOn(process, 'kill').mockImplementation(() => true)
    })

    it('a create that is superseded by a newer create makes the stale handle.destroy() a no-op', async () => {
        const log = mkLog()
        const stale = await createEgressNetns({ log, boxId: 1 })
        const current = await createEgressNetns({ log, boxId: 1 }) // supersedes `stale`

        spawnWithKillMock.mockClear()
        await stale.destroy() // superseded owner → must NOT tear anything down
        expect(ranCommands()).toEqual([])

        await current.destroy() // current owner → tears the box down
        expect(ranCommands()).toContain('ip netns del ap-egress-1')
    })

    it('fails closed when ip_forward is not already enabled (verify-only, never writes)', async () => {
        readFileMock.mockResolvedValue('0')
        await expect(createEgressNetns({ log: mkLog(), boxId: 8 })).rejects.toThrow(/net\.ipv4\.ip_forward/)
        expect(writeFileMock).not.toHaveBeenCalled()
    })

    it('assertEgressCapabilities EXERCISES netns creation — throws when `ip netns add` is denied (not just binary presence)', async () => {
        denyCommand((c) => c.cmd === 'ip' && c.args[0] === 'netns' && c.args[1] === 'add')
        await expect(assertEgressCapabilities()).rejects.toThrow(/cannot create a network namespace/)
        expect(ranCommands().some((command) => command.startsWith('ip netns del ap-egress-probe-'))).toBe(false)
    })

    it('assertEgressCapabilities EXERCISES iptables — throws when chain creation is denied (ip_forward already 1 is not enough)', async () => {
        denyCommand((c) => c.cmd === 'iptables' && c.args.includes('-N'), 'Permission denied')
        await expect(assertEgressCapabilities()).rejects.toThrow(/cannot create an iptables filter chain/)
    })

    it('assertEgressCapabilities cleans up its probe netns + filter/nat chains and exercises ip netns exec', async () => {
        await assertEgressCapabilities()
        const cmds = ranCommands()
        const addNetns = cmds.find((command) => command.startsWith('ip netns add ap-egress-probe-'))
        const execNetns = cmds.find((command) => /^ip netns exec ap-egress-probe-\S+ true$/.test(command))
        const addFilterChain = cmds.find((command) => command.startsWith('iptables --wait 3 -N AP_EG_P_'))
        expect(addNetns).toBeDefined()
        expect(execNetns).toBeDefined()
        expect(addFilterChain).toBeDefined()
        if (!addNetns || !addFilterChain) {
            throw new Error('Capability probes were not created')
        }
        expect(cmds).toContain(addNetns.replace(' add ', ' del '))
        expect(cmds).toContain(addFilterChain.replace(' -N ', ' -X '))
        // MASQUERADE is hook-bound, so it is probed on the REAL POSTROUTING hook, never a user chain.
        expect(cmds).toContain('iptables --wait 3 -t nat -I POSTROUTING 1 -s 192.0.2.0/30 ! -o lo -j MASQUERADE')
        expect(cmds).toContain('iptables --wait 3 -t nat -D POSTROUTING -s 192.0.2.0/30 ! -o lo -j MASQUERADE')
        // ip6tables rule shape is exercised too
        expect(cmds.some((c) => c.startsWith('ip6tables --wait 3 -N AP_EG_P_'))).toBe(true)
        // A probe chain is NEVER created in the nat table; masquerade is hook-bound so it goes to POSTROUTING.
        expect(cmds.some((c) => /-t nat .* -N AP_EG_P_/.test(c))).toBe(false)
    })

    it('assertEgressCapabilities fails closed when ip netns exec is denied', async () => {
        denyCommand((c) => c.cmd === 'ip' && c.args[0] === 'netns' && c.args[1] === 'exec')
        await expect(assertEgressCapabilities()).rejects.toThrow(/cannot exec into a network namespace/)
    })

    it('assertEgressCapabilities fails closed when nat MASQUERADE cannot be installed (probed on the REAL POSTROUTING hook, not a user chain)', async () => {
        denyCommand((c) => c.cmd === 'iptables' && c.args.includes('nat') && c.args.includes('MASQUERADE'), 'No chain/target/match by that name')
        await expect(assertEgressCapabilities()).rejects.toThrow(/nat POSTROUTING MASQUERADE/)
    })

    it('assertEgressCapabilities fails closed when a rule shape (conntrack/REJECT/MASQUERADE) is unsupported', async () => {
        denyCommand((c) => c.cmd === 'iptables' && c.args.includes('conntrack'), 'Couldn\'t load match `conntrack')
        await expect(assertEgressCapabilities()).rejects.toThrow(/kernel module .*conntrack/)
    })

    it('assertEgressCapabilities fails closed when ip6tables rules are unsupported', async () => {
        denyCommand((c) => c.cmd === 'ip6tables' && c.args.includes('-N'), 'ip6tables: can\'t initialize')
        await expect(assertEgressCapabilities()).rejects.toThrow(/ip6 filter chain/)
    })

    it('stale inventory tolerates nat listing failure (best-effort per source)', async () => {
        denyCommand((c) => c.cmd === 'iptables' && c.args.includes('nat') && c.args.includes('-S'), 'iptable_nat not loaded')
        const lease = await prepareEgressEnvironment({ log: mkLog(), allowList: [] })
        await lease.release()
    })

    it('fails closed when a required binary is missing (probed before any resource is created)', async () => {
        denyCommand((c) => c.cmd === 'ip6tables' && c.args.includes('--version'), 'not found')
        await expect(createEgressNetns({ log: mkLog(), boxId: 9 })).rejects.toThrow(/ip6tables.*not available/)
        expect(ranCommands()).not.toContain('ip netns add ap-egress-9')
    })

    it('prepareEgressEnvironment fails closed when a host network is INSIDE the egress /16', async () => {
        stubCommand('ip -o -4 addr show', '2: eth0    inet 10.255.7.2/24 scope global eth0')
        await expect(prepareEgressEnvironment({ log: mkLog() })).rejects.toThrow(/overlaps an existing host network/)
    })

    it('prepareEgressEnvironment does NOT trip on a SUMMARY route that merely contains the pool (10.0.0.0/8, GKE 10.128.0.0/9)', async () => {
        stubCommand('ip -o -4 route show', '10.0.0.0/8 via 10.1.2.3 dev eth0\n10.128.0.0/9 dev eth0 proto kernel')
        const lease = await prepareEgressEnvironment({ log: mkLog() })
        await lease.release()
    })

    it('prepareEgressEnvironment fails closed on a route NEXT-HOP inside the pool (via 10.255.0.1)', async () => {
        stubCommand('ip -o -4 route show', 'default via 10.255.0.1 dev eth0')
        await expect(prepareEgressEnvironment({ log: mkLog() })).rejects.toThrow(/overlaps an existing host network/)
    })

    it('prepareEgressEnvironment fails closed on an interface address inside the pool with a mask WIDER than /16 (inet 10.255.0.7/8)', async () => {
        stubCommand('ip -o -4 addr show', '2: eth0    inet 10.255.0.7/8 scope global eth0')
        await expect(prepareEgressEnvironment({ log: mkLog() })).rejects.toThrow(/overlaps an existing host network/)
    })

    it('prepareEgressEnvironment fails closed when host network inventory (ip addr/route) cannot be read', async () => {
        denyCommand((c) => c.cmd === 'ip' && c.args.join(' ') === '-o -4 addr show', 'Operation not permitted')
        await expect(prepareEgressEnvironment({ log: mkLog() })).rejects.toThrow(/cannot inventory host IPv4/)
    })

    it('DROPS a hostname allow-list entry and still creates the netns (worker keeps running, not bricked)', async () => {
        const log = mkLog()
        await expect(createEgressNetns({ log, boxId: 4, allowList: ['db.internal', '10.9.9.9'] })).resolves.toMatchObject({ netnsName: 'ap-egress-4' })
        expect(ranCommands()).toContain('ip netns add ap-egress-4') // created, not refused
        expect(ranCommands().some((c) => c.includes('AP_EG_FWD_4') && c.includes('10.9.9.9/32') && c.includes('ACCEPT'))).toBe(true) // valid IP still allow-listed
        expect(ranCommands().some((c) => c.includes('db.internal'))).toBe(false) // hostname never reaches the kernel
        expect(log.error).toHaveBeenCalled() // loud
    })

    it('prepareEgressEnvironment does NOT brick on a hostname allow-list (drops it, keeps polling)', async () => {
        const lease = await prepareEgressEnvironment({ log: mkLog(), allowList: ['db.internal'] })
        expect(lease.release).toBeInstanceOf(Function)
        await lease.release() // free the abstract-socket lease for other tests
    })

    it('does NOT install a kernel ACCEPT for metadata/CGNAT even when allow-listed', async () => {
        const handle = await createEgressNetns({
            log: mkLog(),
            boxId: 3,
            allowList: ['169.254.169.254', '100.100.100.200', '10.9.9.9'],
        })
        const cmds = ranCommands()
        expect(cmds).toContain('iptables --wait 3 -A AP_EG_FWD_3 -d 10.9.9.9/32 -j ACCEPT')
        expect(cmds.some((command) => command.includes('169.254') && command.includes('ACCEPT'))).toBe(false)
        expect(cmds.some((command) => command.includes('100.100.100.200') && command.includes('ACCEPT'))).toBe(false)
        await handle.destroy()
    })

    it('does NOT flag overlap against our own ap-veth addresses', async () => {
        stubCommand('ip -o -4 addr show', '9: ap-veth-h1    inet 10.255.0.5/30 scope global ap-veth-h1')
        await expect(createEgressNetns({ log: mkLog(), boxId: 1 })).resolves.toMatchObject({ netnsName: 'ap-egress-1' })
    })

    it('REFUSES to clobber a namespace that survives SIGKILL of orphan pids', async () => {
        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) => {
            const command = `${opts.cmd} ${opts.args.join(' ')}`
            if (command === 'ip netns list') {
                return Promise.resolve({ stdout: 'ap-egress-7 (id: 0)', stderr: '' })
            }
            if (command === 'ip netns pids ap-egress-7') {
                return Promise.resolve({ stdout: '1234\n5678\n', stderr: '' })
            }
            return Promise.resolve({ stdout: '', stderr: '' })
        })
        await expect(createEgressNetns({ log: mkLog(), boxId: 7 })).rejects.toThrow(/still in use by 2 live process/)
        expect(process.kill).toHaveBeenCalledWith(1234, 'SIGKILL')
        expect(process.kill).toHaveBeenCalledWith(5678, 'SIGKILL')
        expect(ranCommands()).not.toContain('ip netns del ap-egress-7')
        expect(ranCommands()).not.toContain('ip netns add ap-egress-7')
    }, 20_000)

    it('SIGKILLs orphans that outlive the wait window, then creates once they exit', async () => {
        // Keyed on the kill landing, not a call count, which would encode how many inspections happen.
        let killed = false
        vi.spyOn(process, 'kill').mockImplementation(() => {
            killed = true
            return true
        })
        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) => {
            const command = `${opts.cmd} ${opts.args.join(' ')}`
            if (command === 'ip netns list') {
                return Promise.resolve({ stdout: 'ap-egress-7 (id: 0)', stderr: '' })
            }
            if (command === 'ip netns pids ap-egress-7') {
                return Promise.resolve({ stdout: killed ? '' : '4321\n', stderr: '' })
            }
            return Promise.resolve({ stdout: '', stderr: '' })
        })
        await expect(createEgressNetns({ log: mkLog(), boxId: 7 })).resolves.toMatchObject({ netnsName: 'ap-egress-7' })
        expect(process.kill).toHaveBeenCalledWith(4321, 'SIGKILL')
        expect(ranCommands()).toContain('ip netns add ap-egress-7')
    }, 20_000)

    it('does NOT SIGKILL a pid that no longer resolves to this namespace (recycled pid guard)', async () => {
        // The pid list can be seconds stale, so an identity mismatch must skip the signal, not guess.
        statMock.mockImplementation((path: string) => Promise.resolve(
            path.startsWith('/proc/') ? { dev: 4, ino: 999999 } : SAME_NETNS,
        ))
        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) => {
            const command = `${opts.cmd} ${opts.args.join(' ')}`
            if (command === 'ip netns list') {
                return Promise.resolve({ stdout: 'ap-egress-7 (id: 0)', stderr: '' })
            }
            if (command === 'ip netns pids ap-egress-7') {
                return Promise.resolve({ stdout: '4321\n', stderr: '' })
            }
            return Promise.resolve({ stdout: '', stderr: '' })
        })
        await expect(createEgressNetns({ log: mkLog(), boxId: 7 })).rejects.toThrow(/still in use by 1 live process/)
        expect(process.kill).not.toHaveBeenCalled()
        expect(ranCommands()).not.toContain('ip netns add ap-egress-7')
    }, 20_000)

    it('waits for a reconnect-orphaned child to exit within the bounded window, then creates', async () => {
        let pidChecks = 0
        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) => {
            const command = `${opts.cmd} ${opts.args.join(' ')}`
            if (command === 'ip netns list') {
                return Promise.resolve({ stdout: 'ap-egress-7 (id: 0)', stderr: '' })
            }
            if (command === 'ip netns pids ap-egress-7') {
                pidChecks++
                return Promise.resolve({ stdout: pidChecks <= 2 ? '4321\n' : '', stderr: '' })
            }
            return Promise.resolve({ stdout: '', stderr: '' })
        })
        await expect(createEgressNetns({ log: mkLog(), boxId: 7 })).resolves.toMatchObject({ netnsName: 'ap-egress-7' })
        expect(pidChecks).toBeGreaterThanOrEqual(3)
        expect(process.kill).not.toHaveBeenCalled()
        expect(ranCommands()).toContain('ip netns add ap-egress-7')
    })

    it('fails closed when an existing namespace cannot be inspected', async () => {
        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) => {
            const command = `${opts.cmd} ${opts.args.join(' ')}`
            if (command === 'ip netns list') {
                return Promise.resolve({ stdout: 'ap-egress-7 (id: 0)', stderr: '' })
            }
            if (command === 'ip netns pids ap-egress-7') {
                return Promise.reject(new Error('permission denied'))
            }
            return Promise.resolve({ stdout: '', stderr: '' })
        })
        await expect(createEgressNetns({ log: mkLog(), boxId: 7 })).rejects.toThrow(/permission denied/)
        expect(ranCommands()).not.toContain('ip netns del ap-egress-7')
    })

    it('LEAVES firewall rules armed when the box VETH cannot be brought down/away — even if `netns del` succeeds (fail-closed)', async () => {
        const log = mkLog()
        const handle = await createEgressNetns({ log, boxId: 4 })

        // netns-del alone does not sever, since a live box keeps the namespace, so filters must stay armed.
        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) => {
            const cmd = `${opts.cmd} ${opts.args.join(' ')}`
            if (cmd === 'ip link set ap-veth-h4 down' || cmd === 'ip link del ap-veth-h4') {
                return Promise.reject(new Error('device busy'))
            }
            return Promise.resolve({ stdout: '', stderr: '' }) // netns del + everything else succeed
        })
        spawnWithKillMock.mockClear()

        await handle.destroy()
        const cmds = ranCommands()
        expect(cmds).toContain('ip netns del ap-egress-4') // netns del was attempted and "succeeded"
        expect(cmds.some((c) => c.includes('iptables') && (c.includes(' -D ') || c.includes(' -F ') || c.includes(' -X ')))).toBe(false)
        expect(log.error).toHaveBeenCalled()
    })

    it('removes firewall rules once the box veth IS brought down (severed)', async () => {
        const log = mkLog()
        const handle = await createEgressNetns({ log, boxId: 4 })
        spawnWithKillMock.mockClear() // all commands succeed (default mock)

        await handle.destroy()
        const cmds = ranCommands()
        expect(cmds).toContain('ip link set ap-veth-h4 down')
        expect(cmds.some((c) => c.includes('iptables') && c.includes(' -X '))).toBe(true) // filters removed
    })

    it('treats a CONFIRMED-absent veth as severed and removes the firewall rules (not a leak)', async () => {
        const log = mkLog()
        const handle = await createEgressNetns({ log, boxId: 4 })
        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) => {
            const cmd = `${opts.cmd} ${opts.args.join(' ')}`
            if (cmd === 'ip link set ap-veth-h4 down' || cmd === 'ip link del ap-veth-h4') {
                return Promise.reject(new Error('Cannot find device "ap-veth-h4"'))
            }
            if (cmd === 'ip link show ap-veth-h4') {
                return Promise.reject(new Error('Device "ap-veth-h4" does not exist.'))
            }
            return Promise.resolve({ stdout: '', stderr: '' })
        })
        spawnWithKillMock.mockClear()

        await handle.destroy()
        expect(ranCommands().some((c) => c.includes('iptables') && c.includes(' -X '))).toBe(true) // absent veth ⇒ severed ⇒ filters removed
    })

    it('does NOT treat a veth-show TIMEOUT as absent — keeps firewall rules armed (fail-closed)', async () => {
        const log = mkLog()
        const handle = await createEgressNetns({ log, boxId: 4 })
        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) => {
            const cmd = `${opts.cmd} ${opts.args.join(' ')}`
            if (cmd === 'ip link set ap-veth-h4 down' || cmd === 'ip link del ap-veth-h4') {
                return Promise.reject(new Error('device busy'))
            }
            if (cmd === 'ip link show ap-veth-h4') {
                return Promise.reject(new Error('Timeout after 5000ms\nstdout: \nstderr: ')) // NOT proof of absence
            }
            return Promise.resolve({ stdout: '', stderr: '' })
        })
        spawnWithKillMock.mockClear()

        await handle.destroy()
        expect(ranCommands().some((c) => c.includes('iptables') && (c.includes(' -D ') || c.includes(' -F ') || c.includes(' -X ')))).toBe(false)
        expect(log.error).toHaveBeenCalled()
    })
})

describe('cleanupStaleEgress', () => {
    beforeEach(() => {
        spawnWithKillMock.mockReset()
        spawnWithKillMock.mockResolvedValue({ stdout: '', stderr: '' })
        writeFileMock.mockResolvedValue(undefined)
        readFileMock.mockResolvedValue('1')
        statMock.mockReset()
        statMock.mockResolvedValue(SAME_NETNS)
        egressNetnsInternals.resetStateForTests()
        vi.spyOn(process, 'kill').mockImplementation(() => true)
    })

    it('reaps unowned stale namespaces, SKIPS a box owned by a live create, and runs once', async () => {
        const log = mkLog()
        await createEgressNetns({ log, boxId: 3 }) // live box → ownership recorded

        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) =>
            (opts.cmd === 'ip' && opts.args.join(' ') === 'netns list')
                ? Promise.resolve({ stdout: 'ap-egress-2 (id: 0)\nap-egress-3 (id: 1)\nother-ns', stderr: '' })
                : Promise.resolve({ stdout: '', stderr: '' }))
        spawnWithKillMock.mockClear()

        await cleanupStaleEgress({ log })
        const cmds = ranCommands()
        expect(cmds).toContain('ip netns del ap-egress-2')     // unowned → swept
        expect(cmds).not.toContain('ip netns del ap-egress-3') // live-owned → skipped (P1b TOCTOU fix)

        spawnWithKillMock.mockClear()
        await cleanupStaleEgress({ log }) // once-guard: subsequent calls do nothing
        expect(spawnWithKillMock).not.toHaveBeenCalled()
    })

    it('reaps a veth/chain-only leak that has NO netns (inventory across all three listings)', async () => {
        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) => {
            const cmd = `${opts.cmd} ${opts.args.join(' ')}`
            if (cmd === 'ip netns list') {
                return Promise.resolve({ stdout: '', stderr: '' }) // no netns at all
            }
            if (cmd === 'ip -o link show') {
                return Promise.resolve({ stdout: '9: ap-veth-h9@if8: <BROADCAST> mtu 1500', stderr: '' })
            }
            if (cmd === 'iptables -S') {
                return Promise.resolve({ stdout: '-N AP_EG_FWD_9\n-A AP_EG_IN_9 -j DROP', stderr: '' })
            }
            return Promise.resolve({ stdout: '', stderr: '' })
        })

        await cleanupStaleEgress({ log: mkLog() })
        const cmds = ranCommands()
        expect(cmds).toContain('ip link del ap-veth-h9')            // veth-only leak swept
        expect(cmds).toContain('iptables --wait 3 -X AP_EG_FWD_9')  // chain-only leak swept (--wait applied at run time)
    })

    it('SIGKILLs orphan pids then reaps the stale namespace', async () => {
        let killed = false
        vi.spyOn(process, 'kill').mockImplementation(() => {
            killed = true
            return true
        })
        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) => {
            const cmd = `${opts.cmd} ${opts.args.join(' ')}`
            if (cmd === 'ip netns list') {
                return Promise.resolve({ stdout: 'ap-egress-2 (id: 0)\nap-egress-5 (id: 1)', stderr: '' })
            }
            if (cmd === 'ip netns pids ap-egress-5') {
                return Promise.resolve({ stdout: killed ? '' : '4321\n', stderr: '' })
            }
            return Promise.resolve({ stdout: '', stderr: '' })
        })

        await cleanupStaleEgress({ log: mkLog() })
        expect(process.kill).toHaveBeenCalledWith(4321, 'SIGKILL')
        const cmds = ranCommands()
        expect(cmds).toContain('ip netns del ap-egress-2')
        expect(cmds).toContain('ip netns del ap-egress-5')
    })

    it('fails stale cleanup when orphans survive SIGKILL', async () => {
        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) => {
            const cmd = `${opts.cmd} ${opts.args.join(' ')}`
            if (cmd === 'ip netns list') {
                return Promise.resolve({ stdout: 'ap-egress-5 (id: 1)', stderr: '' })
            }
            if (cmd === 'ip netns pids ap-egress-5') {
                return Promise.resolve({ stdout: '4321\n', stderr: '' })
            }
            return Promise.resolve({ stdout: '', stderr: '' })
        })

        await expect(cleanupStaleEgress({ log: mkLog() })).rejects.toThrow(/cannot clean stale namespace ap-egress-5/)
        expect(process.kill).toHaveBeenCalledWith(4321, 'SIGKILL')
        expect(ranCommands()).not.toContain('ip netns del ap-egress-5')
    }, 10_000)

    it('treats a failed inventory listing as empty (best-effort) rather than failing readiness', async () => {
        denyCommand((c) => c.cmd === 'ip' && c.args.join(' ') === 'netns list', 'ip netns list failed')
        await expect(cleanupStaleEgress({ log: mkLog() })).resolves.toBeUndefined()
        expect(ranCommands()).not.toContain('ip netns del ap-egress-1')
    })

    it('reaps a NAT-only leak discovered from the nat table (nothing else left behind)', async () => {
        spawnWithKillMock.mockImplementation((opts: { cmd: string, args: string[] }) => {
            const cmd = `${opts.cmd} ${opts.args.join(' ')}`
            if (cmd === 'iptables -t nat -S') {
                return Promise.resolve({ stdout: '-A POSTROUTING -s 10.255.0.28/30 ! -o ap-veth-h7 -j MASQUERADE', stderr: '' })
            }
            return Promise.resolve({ stdout: '', stderr: '' }) // no netns, no veth, no filter chains
        })

        await cleanupStaleEgress({ log: mkLog() })
        expect(ranCommands()).toContain('iptables --wait 3 -t nat -D POSTROUTING -s 10.255.0.28/30 ! -o ap-veth-h7 -j MASQUERADE')
    })
})

describe('egress network ownership lease', () => {
    it('allows only one STRICT worker in a network namespace and releases ownership', async () => {
        const first = await acquireEgressNetworkLease()
        await expect(acquireEgressNetworkLease()).rejects.toThrow(/already owns this network namespace/)
        await first.release()

        const replacement = await acquireEgressNetworkLease()
        await replacement.release()
    })
})
