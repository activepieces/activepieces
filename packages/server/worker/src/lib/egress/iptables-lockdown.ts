import net from 'node:net'
import { tryCatch } from '@activepieces/shared'
import { Logger } from 'pino'
import { spawnWithKill } from '../utils/exec'

const CHAIN = 'AP_EGRESS_LOCKDOWN'

export const iptablesLockdown = {
    async apply(params: ApplyParams): Promise<IptablesLockdown> {
        const { log } = params
        await assertBinaryAvailable({ binary: IPV4.binary })
        await assertBinaryAvailable({ binary: IPV6.binary })

        // Stale chain from an unclean shutdown makes `-N` fail with "Chain already exists",
        // which cascades into a rollback loop. Run the remove commands best-effort first so
        // a restart starts from a clean slate on both families.
        await preflightCleanup({ log, params })

        for (const family of FAMILIES) {
            for (const args of buildApplyCommandsForFamily({ params, rejectWith: family.rejectWith, family: family.ipFamily })) {
                const { error } = await tryCatch(() => runRule({ binary: family.binary, args }))
                if (error) {
                    log.error({ err: error, binary: family.binary, args }, 'iptables rule failed; rolling back')
                    await removeLockdown({ log, params })
                    throw new IptablesLockdownError(
                        `Failed to apply ${family.binary} rule "${args.join(' ')}" — ` +
                        `kernel enforcement requires NET_ADMIN capability and ${family.binary} binary. ${error.message}`,
                    )
                }
            }
        }

        return { remove: () => removeLockdown({ log, params }) }
    },

    buildApplyCommands(params: ApplyParams): string[][] {
        return buildApplyCommandsForFamily({ params, rejectWith: IPV4.rejectWith, family: 4 })
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
    allowDns: ({ chain, protocol, nameserver }: { chain: string, protocol: 'tcp' | 'udp', nameserver: string }): string[] =>
        ['-A', chain, '-d', nameserver, '-p', protocol, '--dport', '53', '-j', 'ACCEPT'],
    rejectAll: ({ chain, rejectWith }: { chain: string, rejectWith: string }): string[] =>
        ['-A', chain, '-j', 'REJECT', '--reject-with', rejectWith],
    jumpFromOutputForUid: ({ uidRange, target }: { uidRange: string, target: string }): string[] =>
        ['-A', 'OUTPUT', '-m', 'owner', '--uid-owner', uidRange, '-j', target],
    detachFromOutputForUid: ({ uidRange, target }: { uidRange: string, target: string }): string[] =>
        ['-D', 'OUTPUT', '-m', 'owner', '--uid-owner', uidRange, '-j', target],
    flushChain: (name: string): string[] => ['-F', name],
    deleteChain: (name: string): string[] => ['-X', name],
}

function buildApplyCommandsForFamily({ params, rejectWith, family }: { params: ApplyParams, rejectWith: string, family: 4 | 6 }): string[][] {
    const { proxyPort, wsRpcPortRange, firstBoxUid, numBoxes, nameservers } = params
    const uidRange = `${firstBoxUid}-${firstBoxUid + numBoxes - 1}`
    const familyNameservers = nameservers.filter((ns) => net.isIP(ns) === family)
    return [
        rule.createChain(CHAIN),
        rule.allowLoopbackTcp({ chain: CHAIN, dport: String(proxyPort) }),
        ...(wsRpcPortRange ? [rule.allowLoopbackTcp({ chain: CHAIN, dport: `${wsRpcPortRange.first}:${wsRpcPortRange.last}` })] : []),
        ...familyNameservers.flatMap((ns) => [
            rule.allowDns({ chain: CHAIN, protocol: 'udp', nameserver: ns }),
            rule.allowDns({ chain: CHAIN, protocol: 'tcp', nameserver: ns }),
        ]),
        rule.rejectAll({ chain: CHAIN, rejectWith }),
        rule.jumpFromOutputForUid({ uidRange, target: CHAIN }),
    ]
}

async function preflightCleanup({ log, params }: { log: Logger, params: ApplyParams }): Promise<void> {
    for (const family of FAMILIES) {
        for (const args of iptablesLockdown.buildRemoveCommands(params)) {
            const { error } = await tryCatch(() => runRule({ binary: family.binary, args }))
            if (error) log.debug({ err: error, binary: family.binary, args }, 'preflight cleanup step had no prior state (expected on fresh start)')
        }
    }
}

async function removeLockdown({ log, params }: { log: Logger, params: ApplyParams }): Promise<void> {
    for (const family of FAMILIES) {
        for (const args of iptablesLockdown.buildRemoveCommands(params)) {
            const { error } = await tryCatch(() => runRule({ binary: family.binary, args }))
            if (error) log.warn({ err: error, binary: family.binary, args }, 'iptables cleanup command failed (best-effort)')
        }
    }
}

async function runRule({ binary, args }: { binary: string, args: string[] }): Promise<void> {
    await spawnWithKill({ cmd: binary, args, timeoutMs: IPTABLES_TIMEOUT_MS })
}

async function assertBinaryAvailable({ binary }: { binary: string }): Promise<void> {
    const { error } = await tryCatch(() => spawnWithKill({ cmd: binary, args: ['-V'], timeoutMs: IPTABLES_TIMEOUT_MS }))
    if (error) {
        throw new IptablesLockdownError(
            `${binary} binary not available. Install ${binary} in the worker image for kernel-enforced SSRF. ${error.message}`,
        )
    }
}

export class IptablesLockdownError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'IptablesLockdownError'
    }
}

const IPV4 = { binary: 'iptables', rejectWith: 'icmp-host-prohibited', ipFamily: 4 } as const
const IPV6 = { binary: 'ip6tables', rejectWith: 'icmp6-adm-prohibited', ipFamily: 6 } as const
const FAMILIES = [IPV4, IPV6] as const

const IPTABLES_TIMEOUT_MS = 5_000

type ApplyParams = {
    proxyPort: number
    wsRpcPortRange?: { first: number, last: number }
    firstBoxUid: number
    numBoxes: number
    nameservers: string[]
    log: Logger
}

export type IptablesLockdown = {
    remove: () => Promise<void>
}
