import { beforeEach, describe, expect, it, vi } from 'vitest'

// In-memory Redis store shared by the mock distributedStore.
const store = new Map<string, unknown>()

// A real-enough distributed lock: serializes fn() per key so we can prove that concurrent
// callers collapse into a single deploy (double-checked locking).
const lockChains = new Map<string, Promise<unknown>>()

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    distributedStore: {
        async get(key: string) {
            return store.has(key) ? store.get(key) : null
        },
        async put(key: string, value: unknown) {
            store.set(key, value)
        },
        async delete(key: string) {
            store.delete(key)
        },
    },
    distributedLock: () => ({
        async runExclusive({ key, fn }: { key: string, fn: () => Promise<unknown> }) {
            const prev = lockChains.get(key) ?? Promise.resolve()
            const run = prev.then(() => fn(), () => fn())
            lockChains.set(key, run.catch(() => undefined))
            return run
        },
    }),
}))

const fakeDeployer = {
    engineToken: 'shared-token',
    baseSourceDir: '/base/gen2',
    describe: vi.fn<(params: { projectId: string }) => Promise<string | null>>(),
    deploy: vi.fn<(params: { projectId: string, source: string }) => Promise<string>>(),
}

vi.mock('../../../../../src/app/workers/function-provisioning/cloud-function-deployer', () => ({
    cloudFunctionDeployer: { create: () => fakeDeployer },
}))

vi.mock('../../../../../src/app/workers/function-provisioning/function-source-builder', () => ({
    functionSourceBuilder: { build: vi.fn(async () => '/staging/proj') },
}))

vi.mock('../../../../../src/app/flows/flow/flow.service', () => ({
    flowService: () => ({ list: vi.fn(async () => ({ data: [] })) }),
}))

import { functionProvisioningService } from '../../../../../src/app/workers/function-provisioning/function-provisioning.service'

const log = { debug() {}, info() {}, warn() {}, error() {} } as never

describe('functionProvisioningService', () => {
    beforeEach(() => {
        store.clear()
        lockChains.clear()
        fakeDeployer.describe.mockReset()
        fakeDeployer.deploy.mockReset()
    })

    it('returns the cached function without touching the cloud provider on a Redis hit', async () => {
        store.set('function:provisioned:p1', { url: 'https://cached', engineToken: 'shared-token' })

        const result = await functionProvisioningService(log).ensure({ projectId: 'p1' })

        expect(result).toEqual({ url: 'https://cached', engineToken: 'shared-token' })
        expect(fakeDeployer.describe).not.toHaveBeenCalled()
        expect(fakeDeployer.deploy).not.toHaveBeenCalled()
    })

    it('skips deploy when the function already exists (describe returns a url) and caches it', async () => {
        fakeDeployer.describe.mockResolvedValue('https://existing')

        const result = await functionProvisioningService(log).ensure({ projectId: 'p2' })

        expect(result.url).toBe('https://existing')
        expect(fakeDeployer.deploy).not.toHaveBeenCalled()
        expect(store.get('function:provisioned:p2')).toEqual({ url: 'https://existing', engineToken: 'shared-token' })
    })

    it('deploys when the function does not exist yet and caches the result', async () => {
        fakeDeployer.describe.mockResolvedValue(null)
        fakeDeployer.deploy.mockResolvedValue('https://deployed')

        const result = await functionProvisioningService(log).ensure({ projectId: 'p3' })

        expect(result.url).toBe('https://deployed')
        expect(fakeDeployer.deploy).toHaveBeenCalledTimes(1)
        expect(store.get('function:provisioned:p3')).toEqual({ url: 'https://deployed', engineToken: 'shared-token' })
    })

    it('deploys exactly once under concurrent provisioning of the same project', async () => {
        fakeDeployer.describe.mockResolvedValue(null)
        let deployCount = 0
        fakeDeployer.deploy.mockImplementation(async () => {
            deployCount += 1
            await new Promise((r) => setTimeout(r, 20))
            return 'https://deployed-once'
        })

        const service = functionProvisioningService(log)
        const results = await Promise.all(
            Array.from({ length: 5 }, () => service.ensure({ projectId: 'p4' })),
        )

        expect(deployCount).toBe(1)
        expect(results.every((r) => r.url === 'https://deployed-once')).toBe(true)
    })

    it('rebuild busts the Redis entry and always redeploys (publish path)', async () => {
        store.set('function:provisioned:p5', { url: 'https://old', engineToken: 'shared-token' })
        fakeDeployer.deploy.mockResolvedValue('https://rebuilt')

        const result = await functionProvisioningService(log).rebuild({ projectId: 'p5' })

        expect(fakeDeployer.describe).not.toHaveBeenCalled() // rebuild never skips
        expect(fakeDeployer.deploy).toHaveBeenCalledTimes(1)
        expect(result.url).toBe('https://rebuilt')
        expect(store.get('function:provisioned:p5')).toEqual({ url: 'https://rebuilt', engineToken: 'shared-token' })
    })
})
