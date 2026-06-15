import { NetworkMode, WorkerSettingsResponse } from '@activepieces/shared'
import { ApLogger } from '@activepieces/server-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

const netnsDestroy = vi.fn(async () => undefined)
const proxyClose = vi.fn(async () => undefined)

vi.mock('../../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: vi.fn(),
    },
}))

vi.mock('../../../src/lib/egress/netns', () => ({
    egressNetns: {
        create: vi.fn(async () => ({
            gatewayHost: '10.255.0.1',
            netnsName: 'ap-egress',
            destroy: netnsDestroy,
        })),
    },
}))

vi.mock('../../../src/lib/egress/proxy', () => ({
    startEgressProxy: vi.fn(async () => ({
        port: 54321,
        close: proxyClose,
    })),
}))

import { workerSettings } from '../../../src/lib/config/worker-settings'
import { egressNetns } from '../../../src/lib/egress/netns'
import { startEgressStack } from '../../../src/lib/egress/lifecycle'
import { startEgressProxy } from '../../../src/lib/egress/proxy'

function stubSettings({ network, allowList = [] }: { network: NetworkMode, allowList?: string[] }): void {
    const partial: Partial<WorkerSettingsResponse> = {
        NETWORK_MODE: network,
        SSRF_ALLOW_LIST: allowList,
    }
    vi.mocked(workerSettings.getSettings).mockReturnValue(partial as WorkerSettingsResponse)
}

describe('startEgressStack', () => {
    afterEach(() => {
        vi.mocked(egressNetns.create).mockClear()
        vi.mocked(startEgressProxy).mockClear()
        netnsDestroy.mockClear()
        proxyClose.mockClear()
        vi.restoreAllMocks()
    })

    it('UNRESTRICTED: no netns, no proxy, all-null stack', async () => {
        stubSettings({ network: NetworkMode.UNRESTRICTED })
        const stack = await startEgressStack({ log, apiUrl: 'http://127.0.0.1:3000' })
        expect(stack.proxyPort).toBeNull()
        expect(stack.gatewayHost).toBeNull()
        expect(stack.netnsName).toBeNull()
        expect(egressNetns.create).not.toHaveBeenCalled()
        expect(startEgressProxy).not.toHaveBeenCalled()
        await stack.shutdown()
    })

    it('STRICT: creates the netns and starts the proxy bound to the gateway IP', async () => {
        stubSettings({ network: NetworkMode.STRICT })
        const stack = await startEgressStack({ log, apiUrl: 'http://127.0.0.1:3000' })
        expect(stack.proxyPort).toBe(54321)
        expect(stack.gatewayHost).toBe('10.255.0.1')
        expect(stack.netnsName).toBe('ap-egress')
        expect(egressNetns.create).toHaveBeenCalledTimes(1)
        expect(startEgressProxy).toHaveBeenCalledTimes(1)
        expect(startEgressProxy).toHaveBeenCalledWith(
            expect.objectContaining({ host: '10.255.0.1' }),
        )
        await stack.shutdown()
        expect(proxyClose).toHaveBeenCalledTimes(1)
        expect(netnsDestroy).toHaveBeenCalledTimes(1)
    })

    it('STRICT: unions the API host IPs and the gateway into the proxy allow list', async () => {
        stubSettings({ network: NetworkMode.STRICT, allowList: ['1.2.3.4'] })
        const stack = await startEgressStack({ log, apiUrl: 'http://127.0.0.1:3000' })
        const call = vi.mocked(startEgressProxy).mock.calls[0]![0]
        expect(call.allowList).toContain('1.2.3.4')
        expect(call.allowList).toContain('127.0.0.1')
        await stack.shutdown()
    })

    it('STRICT: tears down the netns and throws when API host cannot be resolved', async () => {
        stubSettings({ network: NetworkMode.STRICT })
        await expect(
            startEgressStack({ log, apiUrl: 'http://this-host-does-not-resolve.invalid.test:3000' }),
        ).rejects.toThrow(/Failed to resolve API host/)
        expect(egressNetns.create).toHaveBeenCalledTimes(1)
        expect(netnsDestroy).toHaveBeenCalledTimes(1)
        expect(startEgressProxy).not.toHaveBeenCalled()
    })

    it('STRICT: tears down the netns when the proxy fails to start', async () => {
        stubSettings({ network: NetworkMode.STRICT })
        vi.mocked(startEgressProxy).mockRejectedValueOnce(new Error('bind failed'))
        await expect(startEgressStack({ log, apiUrl: 'http://127.0.0.1:3000' })).rejects.toThrow(/bind failed/)
        expect(netnsDestroy).toHaveBeenCalledTimes(1)
    })
})
