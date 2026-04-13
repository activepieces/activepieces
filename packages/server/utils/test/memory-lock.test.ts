import { memoryLock } from '../src/memory-lock'

describe('memoryLock', () => {
    describe('acquire / release', () => {
        it('should acquire and release a lock', async () => {
            const lock = await memoryLock.acquire('test-key-1')
            await lock.release()
        })

        it('should serialize access to the same key', async () => {
            const order: number[] = []

            const lock1 = await memoryLock.acquire('test-key-2')
            const promise2 = (async () => {
                const lock2 = await memoryLock.acquire('test-key-2')
                order.push(2)
                await lock2.release()
            })()

            // Give promise2 a tick to attempt acquire
            await new Promise((r) => setTimeout(r, 10))
            order.push(1)
            await lock1.release()
            await promise2

            expect(order).toEqual([1, 2])
        })
    })

    describe('runExclusive', () => {
        it('should run the function exclusively', async () => {
            const result = await memoryLock.runExclusive({
                key: 'test-key-3',
                fn: async () => 42,
            })
            expect(result).toBe(42)
        })

        it('should release the lock even when the function throws', async () => {
            await expect(
                memoryLock.runExclusive({
                    key: 'test-key-4',
                    fn: async () => {
                        throw new Error('oops')
                    },
                }),
            ).rejects.toThrow('oops')

            // Should be able to acquire the same key again
            const lock = await memoryLock.acquire('test-key-4')
            await lock.release()
        })
    })

    describe('isTimeoutError', () => {
        it('should return false for a regular error', () => {
            expect(memoryLock.isTimeoutError(new Error('nope'))).toBe(false)
        })
    })
})
