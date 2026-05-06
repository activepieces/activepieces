import dnsSync from 'node:dns'
import { ExecutionMode, NetworkMode, WorkerSettingsResponse } from '@activepieces/shared'
import pino from 'pino'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const log = pino({ level: 'silent' })

vi.mock('../../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: vi.fn(),
    },
}))

vi.mock('../../../src/lib/egress/proxy', () => ({
    startEgressProxy: vi.fn(async () => ({
        port: 54321,
        close: vi.fn(async () => undefined),
    })),
}))

vi.mock('../../../src/lib/egress/iptables-lockdown', () => ({
    iptablesLockdown: {
        apply: vi.fn(async () => ({ remove: vi.fn(async () => undefined) })),
    },
}))

vi.mock('../../../src/lib/sandbox/capacity', () => ({
    sandboxCapacity: {
        wsRpcPortRange: { first: 10000, last: 10100 },
        firstBoxUid: 60000,
        numBoxes: 50,
    },
}))

import { workerSettings } from '../../../src/lib/config/worker-settings'
import { startEgressStack } from '../../../src/lib/egress/lifecycle'
import { iptablesLockdown } from '../../../src/lib/egress/iptables-lockdown'
import { startEgressProxy } from '../../../src/lib/egress/proxy'

function stubSettings({ network, execution }: { network: NetworkMode, execution: ExecutionMode }): void {
    const partial: Partial<WorkerSettingsResponse> = {
        NETWORK_MODE: network,
        EXECUTION_MODE: execution,
        SSRF_ALLOW_LIST: [],
    }
    vi.mocked(workerSettings.getSettings).mockReturnValue(partial as WorkerSettingsResponse)
}

describe('startEgressStack', () => {
    beforeEach(() => {
        vi.spyOn(dnsSync, 'getServers').mockReturnValue(['10.0.0.2'])
    })

    afterEach(() => {
        vi.mocked(startEgressProxy).mockClear()
        vi.mocked(iptablesLockdown.apply).mockClear()
        vi.restoreAllMocks()
    })

    it('UNRESTRICTED + isolate: skips proxy and kernel lockdown (no crash)', async () => {
        stubSettings({ network: NetworkMode.UNRESTRICTED, execution: ExecutionMode.SANDBOX_PROCESS })
        const stack = await startEgressStack({ log, apiUrl: 'http://127.0.0.1:3000' })
        expect(stack.proxyPort).toBeNull()
        expect(startEgressProxy).not.toHaveBeenCalled()
        expect(iptablesLockdown.apply).not.toHaveBeenCalled()
        await stack.shutdown()
    })

    it('UNRESTRICTED + unsandboxed: skips proxy and kernel lockdown', async () => {
        stubSettings({ network: NetworkMode.UNRESTRICTED, execution: ExecutionMode.UNSANDBOXED })
        const stack = await startEgressStack({ log, apiUrl: 'http://127.0.0.1:3000' })
        expect(stack.proxyPort).toBeNull()
        expect(startEgressProxy).not.toHaveBeenCalled()
        expect(iptablesLockdown.apply).not.toHaveBeenCalled()
        await stack.shutdown()
    })

    it('STRICT + isolate: starts proxy AND applies kernel lockdown', async () => {
        stubSettings({ network: NetworkMode.STRICT, execution: ExecutionMode.SANDBOX_PROCESS })
        const stack = await startEgressStack({ log, apiUrl: 'http://127.0.0.1:3000' })
        expect(stack.proxyPort).toBe(54321)
        expect(startEgressProxy).toHaveBeenCalledTimes(1)
        expect(iptablesLockdown.apply).toHaveBeenCalledTimes(1)
        await stack.shutdown()
    })

    it('STRICT + isolate: passes host DNS nameservers to the lockdown', async () => {
        vi.mocked(dnsSync.getServers).mockReturnValue(['10.0.0.2', '169.254.169.253'])
        stubSettings({ network: NetworkMode.STRICT, execution: ExecutionMode.SANDBOX_PROCESS })
        const stack = await startEgressStack({ log, apiUrl: 'http://127.0.0.1:3000' })
        expect(iptablesLockdown.apply).toHaveBeenCalledWith(
            expect.objectContaining({ nameservers: ['10.0.0.2', '169.254.169.253'] }),
        )
        await stack.shutdown()
    })

    it('STRICT + isolate: strips port suffixes from dns.getServers() entries', async () => {
        vi.mocked(dnsSync.getServers).mockReturnValue(['8.8.8.8:53', '[2001:4860:4860::8888]:53'])
        stubSettings({ network: NetworkMode.STRICT, execution: ExecutionMode.SANDBOX_PROCESS })
        const stack = await startEgressStack({ log, apiUrl: 'http://127.0.0.1:3000' })
        expect(iptablesLockdown.apply).toHaveBeenCalledWith(
            expect.objectContaining({ nameservers: ['8.8.8.8', '2001:4860:4860::8888'] }),
        )
        await stack.shutdown()
    })

    it('STRICT + isolate: throws fail-fast when no nameservers are configured', async () => {
        vi.mocked(dnsSync.getServers).mockReturnValue([])
        stubSettings({ network: NetworkMode.STRICT, execution: ExecutionMode.SANDBOX_PROCESS })
        await expect(startEgressStack({ log, apiUrl: 'http://127.0.0.1:3000' })).rejects.toThrow(/No DNS nameservers configured/)
        expect(iptablesLockdown.apply).not.toHaveBeenCalled()
    })

    it('STRICT + unsandboxed: starts proxy but does NOT apply kernel lockdown', async () => {
        stubSettings({ network: NetworkMode.STRICT, execution: ExecutionMode.UNSANDBOXED })
        const stack = await startEgressStack({ log, apiUrl: 'http://127.0.0.1:3000' })
        expect(stack.proxyPort).toBe(54321)
        expect(startEgressProxy).toHaveBeenCalledTimes(1)
        expect(iptablesLockdown.apply).not.toHaveBeenCalled()
        await stack.shutdown()
    })

    it('STRICT: throws when API host cannot be resolved (refuses silent broken state)', async () => {
        stubSettings({ network: NetworkMode.STRICT, execution: ExecutionMode.UNSANDBOXED })
        await expect(startEgressStack({ log, apiUrl: 'http://this-host-does-not-resolve.invalid.test:3000' })).rejects.toThrow(/Failed to resolve API host/)
        expect(startEgressProxy).not.toHaveBeenCalled()
    })
})
