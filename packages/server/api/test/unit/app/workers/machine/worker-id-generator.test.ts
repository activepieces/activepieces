import { describe, it, expect, beforeEach } from 'vitest'
import { workerIdGenerator } from '../../../../../src/app/workers/machine/worker-id-generator'
import { redisConnections } from '../../../../../src/app/database/redis-connections'

describe('workerIdGenerator', () => {
    beforeEach(async () => {
        const redis = await redisConnections.useExisting()
        const keys = await redis.keys('workerCacheId:*')
        if (keys.length > 0) {
            await redis.del(...keys)
        }
    })

    it('should allocate ID 0 when no workers exist', async () => {
        const id = await workerIdGenerator.allocate()
        expect(id).toBe(0)
    })

    it('should allocate sequential IDs for multiple workers', async () => {
        const id1 = await workerIdGenerator.allocate()
        const id2 = await workerIdGenerator.allocate()
        const id3 = await workerIdGenerator.allocate()
        expect(id1).toBe(0)
        expect(id2).toBe(1)
        expect(id3).toBe(2)
    })

    it('should fill gaps when a middle ID is released', async () => {
        await workerIdGenerator.allocate() // 0
        const id1 = await workerIdGenerator.allocate() // 1
        await workerIdGenerator.allocate() // 2
        await workerIdGenerator.release(id1) // release 1
        const id3 = await workerIdGenerator.allocate() // should get 1
        expect(id3).toBe(1)
    })

    it('should renew TTL successfully', async () => {
        const id = await workerIdGenerator.allocate()
        await workerIdGenerator.renew(id)
        const redis = await redisConnections.useExisting()
        const ttl = await redis.ttl(`workerCacheId:${id}`)
        expect(ttl).toBeGreaterThan(0)
    })

    it('should handle concurrent allocations atomically', async () => {
        const ids = await Promise.all(
            Array.from({ length: 10 }, () => workerIdGenerator.allocate()),
        )
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(10)
        expect(Math.max(...ids)).toBe(9)
    })

    it('should release an ID so it can be reclaimed', async () => {
        const id = await workerIdGenerator.allocate() // 0
        await workerIdGenerator.release(id)
        const redis = await redisConnections.useExisting()
        const exists = await redis.exists(`workerCacheId:${id}`)
        expect(exists).toBe(0)
        const newId = await workerIdGenerator.allocate()
        expect(newId).toBe(0)
    })
})
