import Redis from 'ioredis'
import { describe, expect, it, vi } from 'vitest'
import { distributedStoreFactory } from '../../../../../src/app/database/redis/distributed-store-factory'

type ExecResult = [error: Error | null, result: unknown][] | null

function storeWithExecResult(execResult: ExecResult): { store: ReturnType<typeof distributedStoreFactory>, setex: ReturnType<typeof vi.fn> } {
    const setex = vi.fn()
    const client = {
        multi: () => ({ setex, set: vi.fn(), exec: () => Promise.resolve(execResult) }),
    } as unknown as Redis
    return { store: distributedStoreFactory(() => Promise.resolve(client)), setex }
}

const TWO_ENTRIES = [
    { key: 'mcp_oauth:revoked_grant:one', value: true },
    { key: 'mcp_oauth:revoked_grant:two', value: true },
]

describe('distributedStore.putBatch', () => {
    it('resolves when every queued command applied', async () => {
        const { store, setex } = storeWithExecResult([[null, 'OK'], [null, 'OK']])

        await expect(store.putBatch(TWO_ENTRIES, 960)).resolves.toBeUndefined()
        expect(setex).toHaveBeenCalledTimes(2)
        expect(setex).toHaveBeenCalledWith('mcp_oauth:revoked_grant:one', 960, 'true')
    })

    it('throws when one command inside the transaction failed', async () => {
        const oom = new Error('OOM command not allowed when used memory > maxmemory')
        const { store } = storeWithExecResult([[null, 'OK'], [oom, null]])

        await expect(store.putBatch(TWO_ENTRIES, 960)).rejects.toThrow(oom)
    })

    it('throws when the transaction was discarded entirely', async () => {
        const { store } = storeWithExecResult(null)

        await expect(store.putBatch(TWO_ENTRIES, 960)).rejects.toThrow('Redis transaction was discarded')
    })

    it('never opens a transaction for an empty batch', async () => {
        const { store, setex } = storeWithExecResult(null)

        await expect(store.putBatch([], 960)).resolves.toBeUndefined()
        expect(setex).not.toHaveBeenCalled()
    })
})
