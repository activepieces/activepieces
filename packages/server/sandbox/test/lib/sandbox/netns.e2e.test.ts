import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { spawnWithKill } from '../../../src/lib/utils/exec'
import { assertEgressCapabilities, createEgressNetns, egressNetnsInternals, EgressNetns } from '../../../src/lib/sandbox/netns'
import { SandboxLogger } from '../../../src/lib/sandbox/types'

// Real kernel, not mocked command strings: opt-in via AP_SANDBOX_NETNS_E2E=1 on a privileged runner.
const E2E_ENABLED = process.env['AP_SANDBOX_NETNS_E2E'] === '1' && typeof process.getuid === 'function' && process.getuid() === 0

const E2E_BOX_ID = 991

function mkLog(): SandboxLogger {
    return { info: () => undefined, debug: () => undefined, error: () => undefined, warn: () => undefined }
}

async function run(cmd: string, args: string[]): Promise<{ ok: boolean, stdout: string }> {
    try {
        const { stdout } = await spawnWithKill({ cmd, args, timeoutMs: 8000 })
        return { ok: true, stdout }
    }
    catch {
        return { ok: false, stdout: '' }
    }
}

// A failed connect alone is a WEAK oracle, so pair it with the REJECT counter below.
async function boxTryConnect({ netnsName, host, port }: { netnsName: string, host: string, port: number }): Promise<boolean> {
    const { ok } = await run('ip', ['netns', 'exec', netnsName, 'timeout', '3', 'bash', '-c', `echo > /dev/tcp/${host}/${port}`])
    return ok
}

// The strong oracle: it proves our rule fired, not merely that the host was unreachable.
async function rejectPktCount({ boxId, cidr }: { boxId: number, cidr: string }): Promise<number> {
    return chainRulePktCount({ boxId, cidr, verdict: 'REJECT' })
}

// The positive oracle: an allow-listed CIDR's ACCEPT rule counted the box's packet.
async function acceptPktCount({ boxId, cidr }: { boxId: number, cidr: string }): Promise<number> {
    return chainRulePktCount({ boxId, cidr, verdict: 'ACCEPT' })
}

async function chainRulePktCount({ boxId, cidr, verdict }: { boxId: number, cidr: string, verdict: string }): Promise<number> {
    const { stdout } = await run('iptables', ['-L', `AP_EG_FWD_${boxId}`, '-v', '-n', '-x'])
    const line = stdout.split('\n').find((l) => l.includes(cidr) && l.includes(verdict))
    if (!line) {
        return 0
    }
    const pkts = Number(line.trim().split(/\s+/)[0])
    return Number.isFinite(pkts) ? pkts : 0
}

// Without a default route the packet dies at routing before our chain, so provision a throwaway uplink.
const E2E_UPLINK_DEV = 'ap-e2e-up'

async function hasDefaultRoute(): Promise<boolean> {
    const { stdout } = await run('ip', ['route', 'show', 'default'])
    return stdout.trim() !== ''
}

describe.skipIf(!E2E_ENABLED)('netns egress (real kernel, privileged)', () => {
    let handle: EgressNetns | null = null
    let createdUplink = false

    beforeAll(async () => {
        await run('ip', ['link', 'set', 'lo', 'up'])
        if (await hasDefaultRoute()) {
            return
        }
        await run('ip', ['link', 'add', E2E_UPLINK_DEV, 'type', 'dummy'])
        await run('ip', ['addr', 'add', '203.0.113.1/24', 'dev', E2E_UPLINK_DEV])
        await run('ip', ['link', 'set', E2E_UPLINK_DEV, 'up'])
        await run('ip', ['route', 'add', 'default', 'via', '203.0.113.254', 'dev', E2E_UPLINK_DEV, 'onlink'])
        createdUplink = true
    })

    afterAll(async () => {
        if (createdUplink) {
            await run('ip', ['link', 'del', E2E_UPLINK_DEV])
        }
    })

    afterEach(async () => {
        if (handle) {
            await handle.destroy()
            handle = null
        }
        for (const command of egressNetnsInternals.buildDestroyCommands(egressNetnsInternals.buildTopology(E2E_BOX_ID))) {
            await run(command.binary, command.args)
        }
    })

    it('assertEgressCapabilities passes on a real privileged kernel', async () => {
        await expect(assertEgressCapabilities()).resolves.toBeUndefined()
    })

    it('creates a namespace + veth + chains that actually exist in the kernel (valid ip/iptables syntax)', async () => {
        handle = await createEgressNetns({ log: mkLog(), boxId: E2E_BOX_ID })
        expect((await run('ip', ['netns', 'list'])).stdout).toContain(`ap-egress-${E2E_BOX_ID}`)
        const rules = (await run('iptables', ['-S'])).stdout
        expect(rules).toContain(`AP_EG_FWD_${E2E_BOX_ID}`)
        expect(rules).toContain(`AP_EG_IN_${E2E_BOX_ID}`)
    })

    it('REJECTs cloud metadata via the egress chain (packet counter proves OUR rule fired, not ambient unreachability)', async () => {
        handle = await createEgressNetns({ log: mkLog(), boxId: E2E_BOX_ID })
        const netnsName = `ap-egress-${E2E_BOX_ID}`

        const before = await rejectPktCount({ boxId: E2E_BOX_ID, cidr: '169.254.0.0/16' })
        const connected = await boxTryConnect({ netnsName, host: '169.254.169.254', port: 80 })
        const after = await rejectPktCount({ boxId: E2E_BOX_ID, cidr: '169.254.0.0/16' })

        expect(connected).toBe(false)     // weak corroboration
        expect(after).toBeGreaterThan(before) // strong: our REJECT rule counted the box's packet(s)
    }, 30_000)

    it('REJECTs RFC1918 via the egress chain (counter oracle)', async () => {
        handle = await createEgressNetns({ log: mkLog(), boxId: E2E_BOX_ID })
        const netnsName = `ap-egress-${E2E_BOX_ID}`

        const before = await rejectPktCount({ boxId: E2E_BOX_ID, cidr: '10.0.0.0/8' })
        await boxTryConnect({ netnsName, host: '10.0.0.1', port: 80 })
        const after = await rejectPktCount({ boxId: E2E_BOX_ID, cidr: '10.0.0.0/8' })

        expect(after).toBeGreaterThan(before)
    }, 30_000)

    it('ACCEPTs an operator allow-listed target while a non-allow-listed sibling stays REJECTed (allow-list really punches through the RFC1918 block)', async () => {
        handle = await createEgressNetns({ log: mkLog(), boxId: E2E_BOX_ID, allowList: ['10.9.9.0/24'] })
        const netnsName = `ap-egress-${E2E_BOX_ID}`

        const accBefore = await acceptPktCount({ boxId: E2E_BOX_ID, cidr: '10.9.9.0/24' })
        const rejBefore = await rejectPktCount({ boxId: E2E_BOX_ID, cidr: '10.0.0.0/8' })
        await boxTryConnect({ netnsName, host: '10.9.9.9', port: 80 })
        // The allow-listed target hit OUR ACCEPT rule and never fell through to the RFC1918 REJECT.
        expect(await acceptPktCount({ boxId: E2E_BOX_ID, cidr: '10.9.9.0/24' })).toBeGreaterThan(accBefore)
        expect(await rejectPktCount({ boxId: E2E_BOX_ID, cidr: '10.0.0.0/8' })).toBe(rejBefore)

        // A sibling one /24 over, not on the allow-list, is still blocked by the same RFC1918 REJECT.
        const rejBeforeSibling = await rejectPktCount({ boxId: E2E_BOX_ID, cidr: '10.0.0.0/8' })
        await boxTryConnect({ netnsName, host: '10.8.8.8', port: 80 })
        expect(await rejectPktCount({ boxId: E2E_BOX_ID, cidr: '10.0.0.0/8' })).toBeGreaterThan(rejBeforeSibling)
    }, 30_000)

    it('leaves NO netns / veth / chain / nat behind after destroy', async () => {
        handle = await createEgressNetns({ log: mkLog(), boxId: E2E_BOX_ID })
        await handle.destroy()
        handle = null
        expect((await run('ip', ['netns', 'list'])).stdout).not.toContain(`ap-egress-${E2E_BOX_ID}`)
        expect((await run('ip', ['-o', 'link', 'show'])).stdout).not.toContain(`ap-veth-h${E2E_BOX_ID}`)
        expect((await run('iptables', ['-S'])).stdout).not.toContain(`AP_EG_FWD_${E2E_BOX_ID}`)
        expect((await run('iptables', ['-t', 'nat', '-S'])).stdout).not.toContain(`ap-veth-h${E2E_BOX_ID}`)
        // Rules in the SHARED chains only name the veth, and they outlive the box, so check for it nowhere.
        expect((await run('iptables', ['-S'])).stdout).not.toContain(`ap-veth-h${E2E_BOX_ID}`)
    })

    it('lowers the box veth MTU to the uplink on both ends (no oversized frames from the box)', async () => {
        const uplinkDev = (await run('ip', ['-o', '-4', 'route', 'show', 'default'])).stdout.match(/\bdev\s+(\S+)/)?.[1]
        expect(uplinkDev).toBeDefined()
        const uplinkMtu = Number((await run('ip', ['-o', 'link', 'show', 'dev', uplinkDev as string])).stdout.match(/\bmtu\s+(\d+)/)?.[1])
        handle = await createEgressNetns({ log: mkLog(), boxId: E2E_BOX_ID })

        const hostVeth = (await run('ip', ['-o', 'link', 'show', 'dev', `ap-veth-h${E2E_BOX_ID}`])).stdout
        const boxVeth = (await run('ip', ['netns', 'exec', `ap-egress-${E2E_BOX_ID}`, 'ip', '-o', 'link', 'show', 'dev', `ap-veth-b${E2E_BOX_ID}`])).stdout
        // Discovery only ever LOWERS: a >=1500 uplink leaves the kernel default in place, which is correct.
        const expected = Math.min(uplinkMtu, 1500)
        expect(Number(hostVeth.match(/\bmtu\s+(\d+)/)?.[1])).toBe(expected)
        expect(Number(boxVeth.match(/\bmtu\s+(\d+)/)?.[1])).toBe(expected)
    }, 30_000)

    it('installs no conntrack-state ACCEPT in the egress chain (the RELATED metadata bypass)', async () => {
        handle = await createEgressNetns({ log: mkLog(), boxId: E2E_BOX_ID })
        const chain = (await run('iptables', ['-S', `AP_EG_FWD_${E2E_BOX_ID}`])).stdout
        expect(chain).not.toContain('ctstate')
        // The reply path keeps ESTABLISHED, and admits RELATED for ICMP only so PMTUD still works.
        const forward = (await run('iptables', ['-S', 'FORWARD'])).stdout
        expect(forward).toContain('--ctstate ESTABLISHED -j ACCEPT')
        expect(forward).toContain('-p icmp -m conntrack --ctstate RELATED -j ACCEPT')
        expect(forward).not.toContain('ESTABLISHED,RELATED')
    }, 30_000)
})
