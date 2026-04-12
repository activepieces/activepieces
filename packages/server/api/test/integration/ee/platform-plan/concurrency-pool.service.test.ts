import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { getConcurrencyPoolLimitKey, getProjectConcurrencyPoolKey } from '../../../../src/app/database/redis/keys'
import { distributedStore, redisConnections } from '../../../../src/app/database/redis-connections'
import { concurrencyPoolService } from '../../../../src/app/ee/platform/concurrency-pool/concurrency-pool.service'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance
let log: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    log = app.log
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    const redis = await redisConnections.useExisting()
    const poolLimitKeys = await redis.keys('concurrency-pool:limit:*')
    const projectPoolKeys = await redis.keys('project:concurrency-pool:*')
    const allKeys = [...poolLimitKeys, ...projectPoolKeys]
    if (allKeys.length > 0) {
        await redis.del(...allKeys)
    }
})

describe('concurrencyPoolService', () => {

    describe('upsertPool', () => {
        it('creates a new pool and writes redis limit key', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { poolId } = await concurrencyPoolService(log).upsertPool({
                platformId: mockPlatform.id,
                key: 'test-pool',
                maxConcurrentJobs: 10,
            })

            const pool = await databaseConnection()
                .getRepository('concurrency_pool')
                .findOneBy({ id: poolId }) as { maxConcurrentJobs: number, platformId: string, key: string }

            expect(pool).not.toBeNull()
            expect(pool.maxConcurrentJobs).toBe(10)
            expect(pool.platformId).toBe(mockPlatform.id)
            expect(pool.key).toBe('test-pool')

            const redisLimit = await distributedStore.get<number>(getConcurrencyPoolLimitKey(poolId))
            expect(redisLimit).toBe(10)
        })

        it('returns same poolId when upserting with same platformId and key', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const service = concurrencyPoolService(log)

            const { poolId: firstPoolId } = await service.upsertPool({
                platformId: mockPlatform.id,
                key: 'shared-pool',
                maxConcurrentJobs: 5,
            })

            const { poolId: secondPoolId } = await service.upsertPool({
                platformId: mockPlatform.id,
                key: 'shared-pool',
                maxConcurrentJobs: 20,
            })

            expect(secondPoolId).toBe(firstPoolId)

            const pool = await databaseConnection()
                .getRepository('concurrency_pool')
                .findOneBy({ id: firstPoolId }) as { maxConcurrentJobs: number }

            expect(pool.maxConcurrentJobs).toBe(20)

            const redisLimit = await distributedStore.get<number>(getConcurrencyPoolLimitKey(firstPoolId))
            expect(redisLimit).toBe(20)
        })

        it('keeps existing limit when upserting without maxConcurrentJobs', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const service = concurrencyPoolService(log)

            const { poolId } = await service.upsertPool({
                platformId: mockPlatform.id,
                key: 'keep-limit-pool',
                maxConcurrentJobs: 15,
            })

            await service.upsertPool({
                platformId: mockPlatform.id,
                key: 'keep-limit-pool',
            })

            const pool = await databaseConnection()
                .getRepository('concurrency_pool')
                .findOneBy({ id: poolId }) as { maxConcurrentJobs: number }

            expect(pool.maxConcurrentJobs).toBe(15)
        })

        it('creates different pools for different keys', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const service = concurrencyPoolService(log)

            const { poolId: poolA } = await service.upsertPool({
                platformId: mockPlatform.id,
                key: 'pool-a',
                maxConcurrentJobs: 5,
            })

            const { poolId: poolB } = await service.upsertPool({
                platformId: mockPlatform.id,
                key: 'pool-b',
                maxConcurrentJobs: 10,
            })

            expect(poolA).not.toBe(poolB)
        })
    })

    describe('getProjectPoolId', () => {
        it('returns the pool id when project has one', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()
            const service = concurrencyPoolService(log)

            const { poolId } = await service.upsertPool({
                platformId: mockPlatform.id,
                key: 'project-pool',
                maxConcurrentJobs: 5,
            })
            await databaseConnection()
                .getRepository('project')
                .update({ id: mockProject.id }, { poolId })

            const result = await service.getProjectPoolId(mockProject.id)

            expect(result).toBe(poolId)
        })

        it('returns null when project has no pool', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()

            const result = await concurrencyPoolService(log).getProjectPoolId(mockProject.id)

            expect(result).toBeNull()
        })
    })

    describe('getPoolLimit', () => {
        it('returns the pool limit from db', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { poolId } = await concurrencyPoolService(log).upsertPool({
                platformId: mockPlatform.id,
                key: 'limit-pool',
                maxConcurrentJobs: 15,
            })

            const limit = await concurrencyPoolService(log).getPoolLimit(poolId)

            expect(limit).toBe(15)
        })

        it('returns null for a non-existent pool id', async () => {
            await mockAndSaveBasicSetup()
            const limit = await concurrencyPoolService(log).getPoolLimit('non-existent-pool-id')

            expect(limit).toBeNull()
        })
    })
})
