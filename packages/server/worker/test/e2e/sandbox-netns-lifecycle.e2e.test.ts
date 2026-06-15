import { execFileSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'
import { egressNetns } from '../../src/lib/egress/netns'
import { requireLinuxPrivileged } from './helpers/privilege-guard'
import { silentLogger } from './helpers/silent-logger'

/**
 * netns lifecycle robustness (ADR 0001: crash-safe, idempotent boot-time cleanup):
 *  - restart idempotency: a stale `ap-egress` left by an unclean shutdown must not
 *    wedge the next boot — create() preflight-cleans and succeeds. This is the exact
 *    restart bug class that plagued the old iptables path.
 *  - no interface leak: create→destroy over many iterations must leave no `ap-egress`
 *    namespace and no `ap-veth-host` link behind, or veth devices would exhaust over
 *    repeated worker restarts.
 */

const NETNS_NAME = 'ap-egress'
const VETH_HOST = 'ap-veth-host'

const skip = requireLinuxPrivileged()

describe.skipIf(skip)('egress netns lifecycle — restart idempotency + no leak', () => {
    afterEach(async () => {
        // Defensive cleanup so a failed assertion mid-test never leaks into the next.
        await egressNetns.destroy({ log: silentLogger() })
    })

    it('recovers from a stale ap-egress left by an unclean shutdown (preflight cleanup)', async () => {
        const first = await egressNetns.create({ log: silentLogger() })
        expect(netnsExists()).toBe(true)
        // Simulate an unclean shutdown: the namespace + veth survive (we do NOT call destroy).
        // The next boot must not fail with "File exists" — create() preflight-cleans the stale state.
        const second = await egressNetns.create({ log: silentLogger() })
        expect(second.netnsName).toBe(NETNS_NAME)
        expect(netnsExists()).toBe(true)
        expect(vethHostExists()).toBe(true)

        await second.destroy()
        // first.destroy points at the same (now-removed) namespace; must be a safe no-op.
        await first.destroy()
        expect(netnsExists()).toBe(false)
    })

    it('leaves no ap-egress netns and no ap-veth-host link after a create/destroy loop', async () => {
        for (let i = 0; i < 4; i++) {
            const ns = await egressNetns.create({ log: silentLogger() })
            expect(netnsExists()).toBe(true)
            expect(vethHostExists()).toBe(true)
            await ns.destroy()
        }
        expect(netnsExists()).toBe(false)
        expect(vethHostExists()).toBe(false)
    })
})

function netnsExists(): boolean {
    const out = execFileSync('ip', ['netns', 'list'], { encoding: 'utf8' })
    return out.split('\n').some((line) => line.trim().split(' ')[0] === NETNS_NAME)
}

function vethHostExists(): boolean {
    try {
        execFileSync('ip', ['link', 'show', VETH_HOST], { stdio: 'pipe' })
        return true
    }
    catch {
        return false
    }
}
