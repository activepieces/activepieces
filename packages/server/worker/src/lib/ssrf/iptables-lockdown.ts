import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { Logger } from 'pino'

const execFileAsync = promisify(execFile)

const CHAIN = 'AP_EGRESS_LOCKDOWN'

export async function applyIptablesLockdown(params: ApplyParams): Promise<IptablesLockdown> {
    const { log } = params
    const rules = buildApplyCommands(params)
    const applied: string[][] = []

    await assertIptablesAvailable()

    for (const cmd of rules) {
        try {
            await runIptables(cmd)
            applied.push(cmd)
        }
        catch (err) {
            log.error({ err, cmd }, 'iptables rule failed; rolling back')
            await safeRollback({ applied, uidRange: buildUidRange(params), log })
            throw new IptablesLockdownError(
                `Failed to apply iptables rule "${cmd.join(' ')}" — ` +
                `kernel enforcement requires NET_ADMIN capability and iptables binary. ${(err as Error).message}`,
            )
        }
    }

    return {
        remove: async () => {
            const removeCmds = buildRemoveCommands(params)
            for (const cmd of removeCmds) {
                try {
                    await runIptables(cmd)
                }
                catch (err) {
                    log.warn({ err, cmd }, 'iptables cleanup command failed (best-effort)')
                }
            }
        },
    }
}

export function buildApplyCommands(params: ApplyParams): string[][] {
    const { proxyPort, wsRpcPorts } = params
    const uidRange = buildUidRange(params)
    return [
        ['-N', CHAIN],
        ['-A', CHAIN, '-o', 'lo', '-p', 'tcp', '--dport', String(proxyPort), '-j', 'ACCEPT'],
        ...wsRpcPorts.map((port) => ['-A', CHAIN, '-o', 'lo', '-p', 'tcp', '--dport', String(port), '-j', 'ACCEPT']),
        ['-A', CHAIN, '-j', 'REJECT', '--reject-with', 'icmp-host-prohibited'],
        ['-A', 'OUTPUT', '-m', 'owner', '--uid-owner', uidRange, '-j', CHAIN],
    ]
}

export function buildRemoveCommands(params: ApplyParams): string[][] {
    const uidRange = buildUidRange(params)
    return [
        ['-D', 'OUTPUT', '-m', 'owner', '--uid-owner', uidRange, '-j', CHAIN],
        ['-F', CHAIN],
        ['-X', CHAIN],
    ]
}

function buildUidRange(params: ApplyParams): string {
    const { firstBoxUid, numBoxes } = params
    const last = firstBoxUid + numBoxes - 1
    return `${firstBoxUid}-${last}`
}

async function runIptables(args: string[]): Promise<void> {
    await execFileAsync('iptables', args)
}

async function assertIptablesAvailable(): Promise<void> {
    try {
        await execFileAsync('iptables', ['-V'])
    }
    catch (err) {
        throw new IptablesLockdownError(
            `iptables binary not available. Install iptables in the worker image for kernel-enforced SSRF. ${(err as Error).message}`,
        )
    }
}

async function safeRollback({ applied, log }: { applied: string[][], uidRange: string, log: Logger }): Promise<void> {
    for (const cmd of [...applied].reverse()) {
        const inverse = toInverse(cmd)
        if (!inverse) continue
        try {
            await runIptables(inverse)
        }
        catch (err) {
            log.warn({ err, inverse }, 'iptables rollback command failed')
        }
    }
    for (const cmd of [['-F', CHAIN], ['-X', CHAIN]]) {
        try {
            await runIptables(cmd)
        }
        catch {
            // nothing to clean up
        }
    }
}

function toInverse(cmd: string[]): string[] | undefined {
    const copy = [...cmd]
    if (copy[0] === '-A') {
        copy[0] = '-D'
        return copy
    }
    if (copy[0] === '-N') {
        return ['-X', copy[1]!]
    }
    return undefined
}

type ApplyParams = {
    proxyPort: number
    wsRpcPorts: number[]
    firstBoxUid: number
    numBoxes: number
    log: Logger
}

export type IptablesLockdown = {
    remove: () => Promise<void>
}

export class IptablesLockdownError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'IptablesLockdownError'
    }
}
