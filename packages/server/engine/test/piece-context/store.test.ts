import { StoreScope } from '@activepieces/pieces-framework'
import { StorageError, StorageInvalidKeyError, StorageLimitError, STORE_KEY_MAX_LENGTH, STORE_VALUE_MAX_SIZE } from '@activepieces/shared'
import { createContextStore } from '../../src/lib/piece-context/store'

const STORE_PARAMS = {
    apiUrl: 'http://localhost:3000/',
    prefix: 'test_',
    flowId: 'flow-123',
    engineToken: 'test-token',
}

describe('store service', () => {

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    describe('createContextStore get()', () => {
        it('returns value when store entry exists', async () => {
            const storeEntry = { key: 'test_flow_flow-123/myKey', value: { foo: 'bar' } }
            vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
                JSON.stringify(storeEntry),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            ))

            const store = createContextStore(STORE_PARAMS)
            const result = await store.get('myKey')

            expect(result).toEqual({ foo: 'bar' })
        })

        it('returns null when store entry is not found (404)', async () => {
            vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 404 }))

            const store = createContextStore(STORE_PARAMS)
            const result = await store.get('missingKey')

            expect(result).toBeNull()
        })

        it('throws StorageInvalidKeyError for empty key', async () => {
            const store = createContextStore(STORE_PARAMS)
            await expect(store.get('')).rejects.toThrow(StorageInvalidKeyError)
        })

        it('throws StorageError on server 500', async () => {
            vi.spyOn(global, 'fetch').mockResolvedValue(new Response('Internal Server Error', { status: 500 }))

            const store = createContextStore(STORE_PARAMS)
            await expect(store.get('myKey')).rejects.toThrow(StorageError)
        })

        it('throws StorageInvalidKeyError when key exceeds max length', async () => {
            const store = createContextStore(STORE_PARAMS)
            const longKey = 'a'.repeat(STORE_KEY_MAX_LENGTH + 1)
            await expect(store.get(longKey)).rejects.toThrow(StorageInvalidKeyError)
        })
    })

    describe('createContextStore put()', () => {
        it('puts value and returns it', async () => {
            const storeEntry = { key: 'test_flow_flow-123/myKey', value: 'hello' }
            vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
                JSON.stringify(storeEntry),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            ))

            const store = createContextStore(STORE_PARAMS)
            const result = await store.put('myKey', 'hello')

            expect(result).toBe('hello')
        })

        it('throws StorageLimitError when value exceeds max size (no fetch call)', async () => {
            const fetchSpy = vi.spyOn(global, 'fetch')
            const largeValue = 'x'.repeat(STORE_VALUE_MAX_SIZE + 1)

            const store = createContextStore(STORE_PARAMS)
            await expect(store.put('myKey', largeValue)).rejects.toThrow(StorageLimitError)
            expect(fetchSpy).not.toHaveBeenCalled()
        })

        it('throws StorageLimitError on 413 response', async () => {
            vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 413 }))

            const store = createContextStore(STORE_PARAMS)
            await expect(store.put('myKey', 'small value')).rejects.toThrow(StorageLimitError)
        })
    })

    describe('createContextStore delete()', () => {
        it('deletes entry and returns void', async () => {
            vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))

            const store = createContextStore(STORE_PARAMS)
            await expect(store.delete('myKey')).resolves.toBeUndefined()
        })

        it('throws StorageInvalidKeyError for empty key', async () => {
            const store = createContextStore(STORE_PARAMS)
            await expect(store.delete('')).rejects.toThrow(StorageInvalidKeyError)
        })
    })

    describe('key scoping', () => {
        it('FLOW scope prefixes key with flow id', async () => {
            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
                JSON.stringify({ key: 'k', value: null }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            ))

            const store = createContextStore(STORE_PARAMS)
            await store.get('myKey', StoreScope.FLOW)

            const calledUrl = fetchSpy.mock.calls[0][0].toString()
            expect(calledUrl).toContain('test_flow_flow-123%2FmyKey')
        })

        it('PROJECT scope prefixes key without flow id', async () => {
            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
                JSON.stringify({ key: 'k', value: null }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            ))

            const store = createContextStore(STORE_PARAMS)
            await store.get('myKey', StoreScope.PROJECT)

            const calledUrl = fetchSpy.mock.calls[0][0].toString()
            expect(calledUrl).toContain('test_myKey')
            expect(calledUrl).not.toContain('flow_')
        })

        it('default scope is FLOW', async () => {
            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
                JSON.stringify({ key: 'k', value: null }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            ))

            const store = createContextStore(STORE_PARAMS)
            await store.get('myKey')

            const calledUrl = fetchSpy.mock.calls[0][0].toString()
            expect(calledUrl).toContain('flow_flow-123')
        })
    })
})
