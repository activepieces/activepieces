import { writeFile } from 'node:fs/promises'
import { tryCatch } from '@activepieces/core-utils'
import { spawnWithKill } from '../utils/exec'
import { sandboxCapacity } from './capacity'
import { SandboxLogger } from './types'

export async function createEgressNetns({ log, boxId }: CreateParams): Promise<EgressNetns> {
    await assertBinaryAvailable({ binary: 'ip' })
    await assertBinaryAvailable({ binary: 'iptables' })
    await enableIpForwarding()

    const topology = buildTopology(boxId)

    // A stale netns/veth/iptables chain from an unclean shutdown makes the create steps
    // fail ("File exists" / "Chain already exists") and cascade into the rollback path.
    // Tear everything down best-effort first so a restart begins from a clean slate.
    await preflightCleanup({ log, topology })

    for (const command of buildCreateCommands(topology)) {
        const { error } = await tryCatch(() => runCommand(command))
        if (error) {
            log.error({ error: String(error), command: `${command.binary} ${command.args.join(' ')}` }, 'egress netns setup step failed; rolling back')
            await destroy({ log, topology })
            throw new EgressNetnsError(
                `Failed to create egress network namespace step "${command.binary} ${command.args.join(' ')}" — ` +
                'SANDBOX_PROCESS + STRICT requires CAP_NET_ADMIN (already granted by the privileged sandbox container), ' +
                `the iproute2 "ip" binary, and iptables in the worker image. ${error.message}`,
            )
        }
    }

    log.info({ netnsName: topology.netnsName, gatewayHost: topology.gatewayHost, boxId }, 'Egress network namespace created')
    return {
        netnsName: topology.netnsName,
        gatewayHost: topology.gatewayHost,
        destroy: () => destroy({ log, topology }),
    }
}

async function destroy({ log, topology }: { log: SandboxLogger, topology: NetnsTopology }): Promise<void> {
    for (const command of buildDestroyCommands(topology)) {
        const { error } = await tryCatch(() => runCommand(command))
        if (error) {
            log.warn({ error: String(error), command: `${command.binary} ${command.args.join(' ')}` }, 'egress netns teardown command failed (best-effort)')
        }
    }
}

async function preflightCleanup({ log, topology }: { log: SandboxLogger, topology: NetnsTopology }): Promise<void> {
    for (const command of buildDestroyCommands(topology)) {
        const { error } = await tryCatch(() => runCommand(command))
        if (error) {
            log.debug({ error: String(error), command: `${command.binary} ${command.args.join(' ')}` }, 'egress netns preflight cleanup had no prior state (expected on fresh start)')
        }
    }
}

async function enableIpForwarding(): Promise<void> {
    // Packets from the box cross the veth into the host netns and must be forwarded out the
    // uplink; without ip_forward the kernel silently drops them. Best-effort: a hardened host
    // may already have it on, and if it is off the FORWARD/NAT rules simply won't route (caught
    // by the STRICT e2e egress test), so we don't hard-fail here on a write error.
    await tryCatch(() => writeFile('/proc/sys/net/ipv4/ip_forward', '1'))
}

async function runCommand({ binary, args }: NetnsCommand): Promise<void> {
    await spawnWithKill({ cmd: binary, args, timeoutMs: COMMAND_TIMEOUT_MS })
}

async function assertBinaryAvailable({ binary }: { binary: string }): Promise<void> {
    const versionFlag = binary === 'ip' ? '-V' : '--version'
    const { error } = await tryCatch(() => spawnWithKill({ cmd: binary, args: [versionFlag], timeoutMs: COMMAND_TIMEOUT_MS }))
    if (error) {
        throw new EgressNetnsError(
            `"${binary}" binary not available. Install ${binary === 'ip' ? 'iproute2' : binary} in the worker image ` +
            `for network-namespace egress isolation in STRICT mode. ${error.message}`,
        )
    }
}

function buildTopology(boxId: number): NetnsTopology {
    // Each box gets its own /30 carved from 10.255.0.0/16: network = boxId*4 (already /30-aligned),
    // gateway = network+1 (host side, hosts the WS-RPC), box = network+2 (inside the netns).
    const offset = boxId * 4
    if (offset + 3 > 0xffff) {
        throw new EgressNetnsError(`boxId ${boxId} is too large for the 10.255.0.0/16 egress pool`)
    }
    const octet = (value: number): string => `10.255.${Math.floor(value / 256)}.${value % 256}`
    return {
        boxId,
        netnsName: `ap-egress-${boxId}`,
        vethHost: `ap-veth-h${boxId}`,
        vethBox: `ap-veth-b${boxId}`,
        subnetCidr: `${octet(offset)}/30`,
        gatewayHost: octet(offset + 1),
        boxHost: octet(offset + 2),
        chain: `AP_EG_FWD_${boxId}`,
        rpcPort: sandboxCapacity.wsRpcPortForBox(boxId),
    }
}

function buildCreateCommands(t: NetnsTopology): NetnsCommand[] {
    const ip = (...args: string[]): NetnsCommand => ({ binary: 'ip', args })
    const iptables = (...args: string[]): NetnsCommand => ({ binary: 'iptables', args })
    return [
        ip('netns', 'add', t.netnsName),
        ip('link', 'add', t.vethHost, 'type', 'veth', 'peer', 'name', t.vethBox),
        ip('link', 'set', t.vethBox, 'netns', t.netnsName),
        ip('addr', 'add', `${t.gatewayHost}/30`, 'dev', t.vethHost),
        ip('link', 'set', t.vethHost, 'up'),
        ip('netns', 'exec', t.netnsName, 'ip', 'addr', 'add', `${t.boxHost}/30`, 'dev', t.vethBox),
        ip('netns', 'exec', t.netnsName, 'ip', 'link', 'set', t.vethBox, 'up'),
        ip('netns', 'exec', t.netnsName, 'ip', 'link', 'set', 'lo', 'up'),
        ip('netns', 'exec', t.netnsName, 'ip', 'route', 'add', 'default', 'via', t.gatewayHost),
        // NAT the box's /30 out the real uplink (everything except back into its own veth).
        iptables('-t', 'nat', '-A', 'POSTROUTING', '-s', t.subnetCidr, '!', '-o', t.vethHost, '-j', 'MASQUERADE'),
        // Egress filter: allow return traffic + public destinations, REJECT internal/metadata/loopback.
        iptables('-N', t.chain),
        iptables('-A', t.chain, '-m', 'conntrack', '--ctstate', 'ESTABLISHED,RELATED', '-j', 'ACCEPT'),
        ...BLOCKED_CIDRS.map((cidr) => iptables('-A', t.chain, '-d', cidr, '-j', 'REJECT', '--reject-with', 'icmp-host-prohibited')),
        iptables('-A', t.chain, '-j', 'ACCEPT'),
        iptables('-A', 'FORWARD', '-s', t.subnetCidr, '-j', t.chain),
        // The box's only permitted reach into the host is the WS-RPC endpoint on the gateway veth IP.
        iptables('-A', 'INPUT', '-i', t.vethHost, '-p', 'tcp', '--dport', String(t.rpcPort), '-j', 'ACCEPT'),
        iptables('-A', 'INPUT', '-i', t.vethHost, '-j', 'DROP'),
    ]
}

function buildDestroyCommands(t: NetnsTopology): NetnsCommand[] {
    const ip = (...args: string[]): NetnsCommand => ({ binary: 'ip', args })
    const iptables = (...args: string[]): NetnsCommand => ({ binary: 'iptables', args })
    // Reverse order of create; deleting the netns auto-removes the box-side veth, so only the
    // host-side veth and the host iptables rules need explicit teardown.
    return [
        iptables('-D', 'INPUT', '-i', t.vethHost, '-j', 'DROP'),
        iptables('-D', 'INPUT', '-i', t.vethHost, '-p', 'tcp', '--dport', String(t.rpcPort), '-j', 'ACCEPT'),
        iptables('-D', 'FORWARD', '-s', t.subnetCidr, '-j', t.chain),
        iptables('-F', t.chain),
        iptables('-X', t.chain),
        iptables('-t', 'nat', '-D', 'POSTROUTING', '-s', t.subnetCidr, '!', '-o', t.vethHost, '-j', 'MASQUERADE'),
        ip('netns', 'del', t.netnsName),
        ip('link', 'del', t.vethHost),
    ]
}

export class EgressNetnsError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'EgressNetnsError'
    }
}

export const egressNetnsInternals = {
    buildTopology,
    buildCreateCommands,
    buildDestroyCommands,
}

const COMMAND_TIMEOUT_MS = 5_000

const BLOCKED_CIDRS: readonly string[] = [
    '169.254.0.0/16',
    '127.0.0.0/8',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '100.64.0.0/10',
]

type NetnsCommand = {
    binary: string
    args: string[]
}

type NetnsTopology = {
    boxId: number
    netnsName: string
    vethHost: string
    vethBox: string
    subnetCidr: string
    gatewayHost: string
    boxHost: string
    chain: string
    rpcPort: number
}

type CreateParams = {
    log: SandboxLogger
    boxId: number
}

export type EgressNetns = {
    netnsName: string
    gatewayHost: string
    destroy: () => Promise<void>
}
