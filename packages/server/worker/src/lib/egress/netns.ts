import { type ApLogger } from '@activepieces/server-utils'
import { ActivepiecesError, ErrorCode, tryCatch } from '@activepieces/shared'
import { spawnWithKill } from '../utils/exec'

export const egressNetns = {
    async create({ log }: CreateParams): Promise<EgressNetns> {
        await assertIpAvailable()

        // A stale ap-egress from an unclean shutdown makes `ip netns add` fail with
        // "File exists", which cascades into the rollback path. Tear down best-effort first
        // so a restart begins from a clean slate (mirrors iptables-lockdown preflightCleanup).
        await preflightCleanup({ log })

        for (const args of egressNetnsInternals.buildCreateCommands()) {
            const { error } = await tryCatch(() => runIp({ args }))
            if (error) {
                log.error({ err: error, args }, 'netns setup step failed; rolling back')
                await destroy({ log })
                const message = `Failed to create egress network namespace step "ip ${args.join(' ')}" — ` +
                    `STRICT mode requires CAP_NET_ADMIN + CAP_SYS_ADMIN and the iproute2 (ip) binary. ${error.message}`
                throw new ActivepiecesError(
                    { code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message } },
                    message,
                )
            }
        }

        log.info({ netnsName: NETNS_NAME, gatewayHost: GATEWAY_HOST }, 'Egress network namespace created')
        return {
            gatewayHost: GATEWAY_HOST,
            netnsName: NETNS_NAME,
            destroy: () => destroy({ log }),
        }
    },

    destroy({ log }: DestroyParams): Promise<void> {
        return destroy({ log })
    },
}

async function destroy({ log }: DestroyParams): Promise<void> {
    for (const args of egressNetnsInternals.buildDestroyCommands()) {
        const { error } = await tryCatch(() => runIp({ args }))
        if (error) log.warn({ err: error, args }, 'netns teardown command failed (best-effort)')
    }
}

async function preflightCleanup({ log }: { log: ApLogger }): Promise<void> {
    for (const args of egressNetnsInternals.buildDestroyCommands()) {
        const { error } = await tryCatch(() => runIp({ args }))
        if (error) log.debug({ err: error, args }, 'netns preflight cleanup had no prior state (expected on fresh start)')
    }
}

async function runIp({ args }: { args: string[] }): Promise<void> {
    await spawnWithKill({ cmd: 'ip', args, timeoutMs: IP_TIMEOUT_MS })
}

async function assertIpAvailable(): Promise<void> {
    const { error } = await tryCatch(() => spawnWithKill({ cmd: 'ip', args: ['-V'], timeoutMs: IP_TIMEOUT_MS }))
    if (error) {
        const message = 'iproute2 "ip" binary not available. Install iproute2 in the worker image for ' +
            `network-namespace egress isolation in STRICT mode. ${error.message}`
        throw new ActivepiecesError(
            { code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message } },
            message,
        )
    }
}

export const egressNetnsInternals = {
    buildCreateCommands(): string[][] {
        return [
            ['netns', 'add', NETNS_NAME],
            ['link', 'add', VETH_HOST, 'type', 'veth', 'peer', 'name', VETH_BOX],
            ['link', 'set', VETH_BOX, 'netns', NETNS_NAME],
            ['addr', 'add', `${GATEWAY_HOST}/30`, 'dev', VETH_HOST],
            ['link', 'set', VETH_HOST, 'up'],
            ['netns', 'exec', NETNS_NAME, 'ip', 'addr', 'add', `${BOX_HOST}/30`, 'dev', VETH_BOX],
            ['netns', 'exec', NETNS_NAME, 'ip', 'link', 'set', VETH_BOX, 'up'],
            ['netns', 'exec', NETNS_NAME, 'ip', 'link', 'set', 'lo', 'up'],
        ]
    },
    buildDestroyCommands(): string[][] {
        // Deleting the netns auto-removes ap-veth-box (its peer end lived inside it).
        // ap-veth-host stays in the main netns, so delete it explicitly.
        return [
            ['netns', 'del', NETNS_NAME],
            ['link', 'del', VETH_HOST],
        ]
    },
}

const NETNS_NAME = 'ap-egress'
const VETH_HOST = 'ap-veth-host'
const VETH_BOX = 'ap-veth-box'
const GATEWAY_HOST = '10.255.0.1'
const BOX_HOST = '10.255.0.2'
const IP_TIMEOUT_MS = 5_000

type CreateParams = {
    log: ApLogger
}

type DestroyParams = {
    log: ApLogger
}

export type EgressNetns = {
    gatewayHost: string
    netnsName: string
    destroy: () => Promise<void>
}
