import { tryCatch } from '@activepieces/shared'
import { Logger } from 'pino'
import { spawnWithKill } from '../utils/exec'

const CHAIN = 'AP_EGRESS_LOCKDOWN'

export const iptablesLockdown = {
    async apply(params: ApplyParams): Promise<IptablesLockdown> {
        const { log } = params
        await assertIptablesAvailable()

        for (const cmd of iptablesLockdown.buildApplyCommands(params)) {
            const { error } = await tryCatch(() => runIptables(cmd))
            if (error) {
                log.error({ err: error, cmd }, 'iptables rule failed; rolling back')
                await removeLockdown({ log, params })
                throw new IptablesLockdownError(
                    `Failed to apply iptables rule "${cmd.join(' ')}" — ` +
                    `kernel enforcement requires NET_ADMIN capability and iptables binary. ${error.message}`,
                )
            }
        }

        return { remove: () => removeLockdown({ log, params }) }
    },

    buildApplyCommands(params: ApplyParams): string[][] {
        const { proxyPort, wsRpcPortRange, firstBoxUid, numBoxes } = params
        const uidRange = `${firstBoxUid}-${firstBoxUid + numBoxes - 1}`
        return [
            rule.createChain(CHAIN),
            rule.allowLoopbackTcp({ chain: CHAIN, dport: String(proxyPort) }),
            ...(wsRpcPortRange ? [rule.allowLoopbackTcp({ chain: CHAIN, dport: `${wsRpcPortRange.first}:${wsRpcPortRange.last}` })] : []),
            rule.rejectAll({ chain: CHAIN, rejectWith: 'icmp-host-prohibited' }),
            rule.jumpFromOutputForUid({ uidRange, target: CHAIN }),
        ]
    },

    buildRemoveCommands({ firstBoxUid, numBoxes }: ApplyParams): string[][] {
        const uidRange = `${firstBoxUid}-${firstBoxUid + numBoxes - 1}`
        return [
            rule.detachFromOutputForUid({ uidRange, target: CHAIN }),
            rule.flushChain(CHAIN),
            rule.deleteChain(CHAIN),
        ]
    },
}

const rule = {
    createChain: (name: string): string[] => ['-N', name],
    allowLoopbackTcp: ({ chain, dport }: { chain: string, dport: string }): string[] =>
        ['-A', chain, '-o', 'lo', '-p', 'tcp', '--dport', dport, '-j', 'ACCEPT'],
    rejectAll: ({ chain, rejectWith }: { chain: string, rejectWith: string }): string[] =>
        ['-A', chain, '-j', 'REJECT', '--reject-with', rejectWith],
    jumpFromOutputForUid: ({ uidRange, target }: { uidRange: string, target: string }): string[] =>
        ['-A', 'OUTPUT', '-m', 'owner', '--uid-owner', uidRange, '-j', target],
    detachFromOutputForUid: ({ uidRange, target }: { uidRange: string, target: string }): string[] =>
        ['-D', 'OUTPUT', '-m', 'owner', '--uid-owner', uidRange, '-j', target],
    flushChain: (name: string): string[] => ['-F', name],
    deleteChain: (name: string): string[] => ['-X', name],
}

async function removeLockdown({ log, params }: { log: Logger, params: ApplyParams }): Promise<void> {
    for (const cmd of iptablesLockdown.buildRemoveCommands(params)) {
        const { error } = await tryCatch(() => runIptables(cmd))
        if (error) log.warn({ err: error, cmd }, 'iptables cleanup command failed (best-effort)')
    }
}

async function runIptables(args: string[]): Promise<void> {
    await spawnWithKill({ cmd: 'iptables', args, timeoutMs: IPTABLES_TIMEOUT_MS })
}

async function assertIptablesAvailable(): Promise<void> {
    const { error } = await tryCatch(() => spawnWithKill({ cmd: 'iptables', args: ['-V'], timeoutMs: IPTABLES_TIMEOUT_MS }))
    if (error) {
        throw new IptablesLockdownError(
            `iptables binary not available. Install iptables in the worker image for kernel-enforced SSRF. ${error.message}`,
        )
    }
}

export class IptablesLockdownError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'IptablesLockdownError'
    }
}

const IPTABLES_TIMEOUT_MS = 5_000

type ApplyParams = {
    proxyPort: number
    wsRpcPortRange?: { first: number, last: number }
    firstBoxUid: number
    numBoxes: number
    log: Logger
}

export type IptablesLockdown = {
    remove: () => Promise<void>
}
