import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { getConcurrencyPoolLimitKey, getProjectConcurrencyPoolKey } from '../../../../src/app/database/redis/keys'
import { distributedStore, redisConnections } from '../../../../src/app/database/redis-connections'
import { concurrencyPoolService } from '../../../../src/app/ee/platform/concurrency-pool/concurrency-pool.service'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { createMockProject, mockAndSaveBasicSetup } from '../../../helpers/mocks'

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

    describe('setProjectConcurrencyLimit', () => {
        it('creates a new solo pool and writes redis keys when project has no pool', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            await concurrencyPoolService(log).setProjectConcurrencyLimit({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                maxConcurrentJobs: 10,
            })

            const updatedProject = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: mockProject.id }) as { poolId: string }

            expect(updatedProject.poolId).not.toBeNull()

            const pool = await databaseConnection()
                .getRepository('concurrency_pool')
                .findOneBy({ id: updatedProject.poolId }) as { maxConcurrentJobs: number, platformId: string }

            expect(pool).not.toBeNull()
            expect(pool.maxConcurrentJobs).toBe(10)
            expect(pool.platformId).toBe(mockPlatform.id)

            const redisPoolId = await distributedStore.get<string>(getProjectConcurrencyPoolKey(mockProject.id))
            const redisLimit = await distributedStore.get<number>(getConcurrencyPoolLimitKey(updatedProject.poolId))

            expect(redisPoolId).toBe(updatedProject.poolId)
            expect(redisLimit).toBe(10)
        })

        it('updates maxConcurrentJobs in-place when project is the sole member of its pool', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            await concurrencyPoolService(log).setProjectConcurrencyLimit({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                maxConcurrentJobs: 5,
            })

            const afterFirst = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: mockProject.id }) as { poolId: string }
            const originalPoolId = afterFirst.poolId

            await concurrencyPoolService(log).setProjectConcurrencyLimit({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                maxConcurrentJobs: 20,
            })

            const afterSecond = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: mockProject.id }) as { poolId: string }

            // Pool ID unchanged — same pool updated in-place
            expect(afterSecond.poolId).toBe(originalPoolId)

            const pool = await databaseConnection()
                .getRepository('concurrency_pool')
                .findOneBy({ id: originalPoolId }) as { maxConcurrentJobs: number }

            expect(pool.maxConcurrentJobs).toBe(20)
            expect(await distributedStore.get<number>(getConcurrencyPoolLimitKey(originalPoolId))).toBe(20)
        })

        it('detaches project from shared pool and creates new solo pool', async () => {
            const { mockProject: projA, mockPlatform } = await mockAndSaveBasicSetup()

            const projB = createMockProject({ ownerId: projA.ownerId, platformId: mockPlatform.id })
            await databaseConnection().getRepository('project').save(projB)

            await concurrencyPoolService(log).upsertPool({
                platformId: mockPlatform.id,
                projectIds: [projA.id, projB.id],
                maxConcurrentJobs: 3,
            })

            const sharedProjA = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: projA.id }) as { poolId: string }
            const sharedPoolId = sharedProjA.poolId

            // Both projects are in the shared pool
            const sharedProjB = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: projB.id }) as { poolId: string }
            expect(sharedProjB.poolId).toBe(sharedPoolId)

            // Detach projA from the shared pool with its own limit
            await concurrencyPoolService(log).setProjectConcurrencyLimit({
                projectId: projA.id,
                platformId: mockPlatform.id,
                maxConcurrentJobs: 7,
            })

            const afterDetach = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: projA.id }) as { poolId: string }

            // projA now has a new pool
            expect(afterDetach.poolId).not.toBe(sharedPoolId)
            expect(afterDetach.poolId).not.toBeNull()

            // projB still has the shared pool
            const projBAfter = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: projB.id }) as { poolId: string }
            expect(projBAfter.poolId).toBe(sharedPoolId)

            // projA Redis mapping cleared from old pool, set to new pool
            const projARedisPool = await distributedStore.get<string>(getProjectConcurrencyPoolKey(projA.id))
            expect(projARedisPool).toBe(afterDetach.poolId)

            const newPoolLimit = await distributedStore.get<number>(getConcurrencyPoolLimitKey(afterDetach.poolId))
            expect(newPoolLimit).toBe(7)
        })
    })

    describe('upsertPool', () => {
        it('creates a new pool, assigns all projects, and writes redis', async () => {
            const { mockProject: projA, mockPlatform } = await mockAndSaveBasicSetup()
            const projB = createMockProject({ ownerId: projA.ownerId, platformId: mockPlatform.id })
            await databaseConnection().getRepository('project').save(projB)

            const { poolId } = await concurrencyPoolService(log).upsertPool({
                platformId: mockPlatform.id,
                projectIds: [projA.id, projB.id],
                maxConcurrentJobs: 8,
            })

            const pool = await databaseConnection()
                .getRepository('concurrency_pool')
                .findOneBy({ id: poolId }) as { maxConcurrentJobs: number, platformId: string }

            expect(pool).not.toBeNull()
            expect(pool.maxConcurrentJobs).toBe(8)
            expect(pool.platformId).toBe(mockPlatform.id)

            const pA = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: projA.id }) as { poolId: string }
            const pB = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: projB.id }) as { poolId: string }

            expect(pA.poolId).toBe(poolId)
            expect(pB.poolId).toBe(poolId)

            expect(await distributedStore.get<number>(getConcurrencyPoolLimitKey(poolId))).toBe(8)
            expect(await distributedStore.get<string>(getProjectConcurrencyPoolKey(projA.id))).toBe(poolId)
            expect(await distributedStore.get<string>(getProjectConcurrencyPoolKey(projB.id))).toBe(poolId)
        })

        it('deletes old orphaned pool and invalidates redis when re-assigning projects', async () => {
            const { mockProject: projA, mockPlatform } = await mockAndSaveBasicSetup()
            const projB = createMockProject({ ownerId: projA.ownerId, platformId: mockPlatform.id })
            await databaseConnection().getRepository('project').save(projB)

            const { poolId: oldPoolId } = await concurrencyPoolService(log).upsertPool({
                platformId: mockPlatform.id,
                projectIds: [projA.id],
                maxConcurrentJobs: 4,
            })

            const { poolId: newPoolId } = await concurrencyPoolService(log).upsertPool({
                platformId: mockPlatform.id,
                projectIds: [projA.id, projB.id],
                maxConcurrentJobs: 12,
            })

            expect(newPoolId).not.toBe(oldPoolId)

            // Old pool row deleted
            const oldPool = await databaseConnection()
                .getRepository('concurrency_pool')
                .findOneBy({ id: oldPoolId })
            expect(oldPool).toBeNull()

            // projA points to new pool
            const pA = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: projA.id }) as { poolId: string }
            expect(pA.poolId).toBe(newPoolId)

            // projB detached (poolId null)
            const pB = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: projB.id }) as { poolId: string | null }
            expect(pB.poolId).toBe(newPoolId)

            // Old redis keys gone
            expect(await distributedStore.get<number>(getConcurrencyPoolLimitKey(oldPoolId))).toBeNull()

            // New redis keys set
            expect(await distributedStore.get<number>(getConcurrencyPoolLimitKey(newPoolId))).toBe(12)
            expect(await distributedStore.get<string>(getProjectConcurrencyPoolKey(projA.id))).toBe(newPoolId)
        })
    })

    describe('getProjectPoolId', () => {
        it('returns the pool id when project has one', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            await concurrencyPoolService(log).setProjectConcurrencyLimit({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                maxConcurrentJobs: 5,
            })

            const poolId = await concurrencyPoolService(log).getProjectPoolId(mockProject.id)

            const dbProject = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: mockProject.id }) as { poolId: string }

            expect(poolId).toBe(dbProject.poolId)
        })

        it('returns null when project has no pool', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const poolId = await concurrencyPoolService(log).getProjectPoolId(mockProject.id)

            expect(poolId).toBeNull()
        })
    })

    describe('getPoolLimit', () => {
        it('returns the pool limit from db', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            await concurrencyPoolService(log).setProjectConcurrencyLimit({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                maxConcurrentJobs: 15,
            })

            const dbProject = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: mockProject.id }) as { poolId: string }

            const limit = await concurrencyPoolService(log).getPoolLimit(dbProject.poolId)

            expect(limit).toBe(15)
        })

        it('returns null for a non-existent pool id', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const limit = await concurrencyPoolService(log).getPoolLimit('non-existent-pool-id')

            expect(limit).toBeNull()
        })
    })
})
