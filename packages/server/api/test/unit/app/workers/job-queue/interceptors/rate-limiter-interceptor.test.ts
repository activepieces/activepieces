import { ApEdition, ExecutionType, JOB_PRIORITY, PlanName, ProgressUpdateType, RATE_LIMIT_PRIORITY, RunEnvironment, WorkerJobType } from '@activepieces/shared'
import { Job } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { Redis } from 'ioredis'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getConcurrencyPoolLimitKey, getConcurrencyPoolSetKey, getPlatformPlanNameKey, getProjectConcurrencyPoolKey } from '../../../../../../src/app/database/redis/keys'
import { distributedStore, redisConnections } from '../../../../../../src/app/database/redis-connections'
import { system } from '../../../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../../../src/app/helper/system/system-props'
import { rateLimiterInterceptor } from '../../../../../../src/app/workers/job-queue/interceptors/rate-limiter-interceptor'
import { InterceptorVerdict } from '../../../../../../src/app/workers/job-queue/job-interceptor'

const mockLog: FastifyBaseLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
    silent: vi.fn(),
    level: 'info',
} as unknown as FastifyBaseLogger

function createFlowJobData(overrides?: Record<string, unknown>) {
    return {
        jobType: WorkerJobType.EXECUTE_FLOW,
        environment: RunEnvironment.PRODUCTION,
        projectId: `proj-${crypto.randomUUID()}`,
        platformId: `plat-${crypto.randomUUID()}`,
        schemaVersion: 4,
        flowId: `flow-${crypto.randomUUID()}`,
        flowVersionId: `fv-${crypto.randomUUID()}`,
        runId: `run-${crypto.randomUUID()}`,
        executionType: ExecutionType.BEGIN,
        progressUpdateType: ProgressUpdateType.NONE,
        payload: {},
        logsUploadUrl: 'http://localhost/logs',
        logsFileId: 'log-file-id',
        ...overrides,
    }
}

function createMockJob(overrides?: Record<string, unknown>) {
    return { attemptsMade: 0, ...overrides } as unknown as Job
}

function enableRateLimiter() {
    vi.spyOn(system, 'getBoolean').mockImplementation((prop) => {
        if (prop === AppSystemProp.PROJECT_RATE_LIMITER_ENABLED) return true
        return undefined
    })
}

function disableRateLimiter() {
    vi.spyOn(system, 'getBoolean').mockImplementation((prop) => {
        if (prop === AppSystemProp.PROJECT_RATE_LIMITER_ENABLED) return false
        return undefined
    })
}

async function deleteKeysByPattern(redis: Redis, pattern: string): Promise<void> {
    const stream = redis.scanStream({ match: pattern, count: 100 })
    for await (const keys of stream) {
        if (keys.length > 0) await redis.del(...keys)
    }
}

describe('rateLimiterInterceptor', () => {
    beforeEach(async () => {
        vi.restoreAllMocks()
        enableRateLimiter()
        vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
            if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
            if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 100
            return 0
        })
        vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.COMMUNITY)

        const redis = await redisConnections.useExisting()
        await deleteKeysByPattern(redis, 'active_jobs_set:*')
        await deleteKeysByPattern(redis, 'project:max-concurrent-jobs:*')
        await deleteKeysByPattern(redis, 'platform_plan:plan:*')
        await deleteKeysByPattern(redis, 'project:concurrency-pool:*')
        await deleteKeysByPattern(redis, 'concurrency-pool:limit:*')
    })

    describe('skip guards', () => {
        it('should ALLOW when rate limiter is disabled', async () => {
            disableRateLimiter()
            const jobData = createFlowJobData()
            const result = await rateLimiterInterceptor.preDispatch({
                jobId: 'job-1',
                jobData,
                job: createMockJob(),
                log: mockLog,
            })
            expect(result.verdict).toBe(InterceptorVerdict.ALLOW)
        })

        it('should ALLOW for non-EXECUTE_FLOW job type', async () => {
            const jobData = createFlowJobData({ jobType: WorkerJobType.EXECUTE_WEBHOOK })
            const result = await rateLimiterInterceptor.preDispatch({
                jobId: 'job-1',
                jobData,
                job: createMockJob(),
                log: mockLog,
            })
            expect(result.verdict).toBe(InterceptorVerdict.ALLOW)
        })

        it('should ALLOW for TESTING environment', async () => {
            const jobData = createFlowJobData({ environment: RunEnvironment.TESTING })
            const result = await rateLimiterInterceptor.preDispatch({
                jobId: 'job-1',
                jobData,
                job: createMockJob(),
                log: mockLog,
            })
            expect(result.verdict).toBe(InterceptorVerdict.ALLOW)
        })
    })

    describe('slot acquisition', () => {
        it('should ALLOW first job when under limit', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 2
                return 0
            })
            const jobData = createFlowJobData()
            const result = await rateLimiterInterceptor.preDispatch({
                jobId: 'job-1',
                jobData,
                job: createMockJob(),
                log: mockLog,
            })
            expect(result.verdict).toBe(InterceptorVerdict.ALLOW)

            const redis = await redisConnections.useExisting()
            const members = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(members).toHaveLength(1)
            expect(members[0]).toBe(`${jobData.projectId}:job-1`)
        })

        it('should ALLOW up to max concurrent jobs', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 3
                return 0
            })
            const jobData = createFlowJobData()

            for (let i = 0; i < 3; i++) {
                const result = await rateLimiterInterceptor.preDispatch({
                    jobId: `job-${i}`,
                    jobData,
                    job: createMockJob(),
                    log: mockLog,
                })
                expect(result.verdict).toBe(InterceptorVerdict.ALLOW)
            }

            const redis = await redisConnections.useExisting()
            const members = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(members).toHaveLength(3)
        })

        it('should REJECT when at capacity', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 2
                return 0
            })
            const jobData = createFlowJobData()

            await rateLimiterInterceptor.preDispatch({ jobId: 'job-1', jobData, job: createMockJob(), log: mockLog })
            await rateLimiterInterceptor.preDispatch({ jobId: 'job-2', jobData, job: createMockJob(), log: mockLog })

            const result = await rateLimiterInterceptor.preDispatch({
                jobId: 'job-3',
                jobData,
                job: createMockJob(),
                log: mockLog,
            })
            expect(result.verdict).toBe(InterceptorVerdict.REJECT)
            if (result.verdict === InterceptorVerdict.REJECT) {
                expect(result.delayInMs).toBe(20_000)
                expect(result.priority).toBe(JOB_PRIORITY[RATE_LIMIT_PRIORITY])
            }
        })

        it('should not double-count the same jobId', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 2
                return 0
            })
            const jobData = createFlowJobData()

            const r1 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-same', jobData, job: createMockJob(), log: mockLog })
            expect(r1.verdict).toBe(InterceptorVerdict.ALLOW)

            // Dispatch same jobId again — Lua dedup returns 0 (allowed) without adding duplicate
            const r2 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-same', jobData, job: createMockJob(), log: mockLog })
            expect(r2.verdict).toBe(InterceptorVerdict.ALLOW)

            const redis = await redisConnections.useExisting()
            const members = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(members).toHaveLength(1)
        })

        it('should not let different projects interfere', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 1
                return 0
            })
            const jobDataA = createFlowJobData({ projectId: 'proj-A' })
            const jobDataB = createFlowJobData({ projectId: 'proj-B' })

            // Fill project A
            await rateLimiterInterceptor.preDispatch({ jobId: 'job-a', jobData: jobDataA, job: createMockJob(), log: mockLog })

            // Project A is full
            const rejectA = await rateLimiterInterceptor.preDispatch({ jobId: 'job-a2', jobData: jobDataA, job: createMockJob(), log: mockLog })
            expect(rejectA.verdict).toBe(InterceptorVerdict.REJECT)

            // Project B should still ALLOW
            const allowB = await rateLimiterInterceptor.preDispatch({ jobId: 'job-b', jobData: jobDataB, job: createMockJob(), log: mockLog })
            expect(allowB.verdict).toBe(InterceptorVerdict.ALLOW)
        })
    })

    describe('exponential backoff', () => {
        beforeEach(() => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 1
                return 0
            })
        })

        it('should compute delay for attemptsMade=0', async () => {
            const jobData = createFlowJobData()
            await rateLimiterInterceptor.preDispatch({ jobId: 'job-fill', jobData, job: createMockJob(), log: mockLog })

            const result = await rateLimiterInterceptor.preDispatch({
                jobId: 'job-reject',
                jobData,
                job: createMockJob({ attemptsMade: 0 }),
                log: mockLog,
            })
            expect(result.verdict).toBe(InterceptorVerdict.REJECT)
            if (result.verdict === InterceptorVerdict.REJECT) {
                expect(result.delayInMs).toBe(Math.min(600_000, 20_000 * Math.pow(2, 0)))
            }
        })

        it('should compute delay for attemptsMade=3', async () => {
            const jobData = createFlowJobData()
            await rateLimiterInterceptor.preDispatch({ jobId: 'job-fill', jobData, job: createMockJob(), log: mockLog })

            const result = await rateLimiterInterceptor.preDispatch({
                jobId: 'job-reject',
                jobData,
                job: createMockJob({ attemptsMade: 3 }),
                log: mockLog,
            })
            expect(result.verdict).toBe(InterceptorVerdict.REJECT)
            if (result.verdict === InterceptorVerdict.REJECT) {
                expect(result.delayInMs).toBe(Math.min(600_000, 20_000 * Math.pow(2, 3)))
            }
        })

        it('should cap delay at 600_000 for high attemptsMade', async () => {
            const jobData = createFlowJobData()
            await rateLimiterInterceptor.preDispatch({ jobId: 'job-fill', jobData, job: createMockJob(), log: mockLog })

            const result = await rateLimiterInterceptor.preDispatch({
                jobId: 'job-reject',
                jobData,
                job: createMockJob({ attemptsMade: 10 }),
                log: mockLog,
            })
            expect(result.verdict).toBe(InterceptorVerdict.REJECT)
            if (result.verdict === InterceptorVerdict.REJECT) {
                expect(result.delayInMs).toBe(600_000)
            }
        })
    })

    describe('expired job cleanup', () => {
        it('should clean stale jobs and allow new ones', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 1
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 1
                return 0
            })
            const jobData = createFlowJobData()
            const setKey = getConcurrencyPoolSetKey(jobData.projectId)

            // Manually insert a stale entry with an old timestamp (score = old time)
            const redis = await redisConnections.useExisting()
            const oldTimestamp = Date.now() - 120_000 // 2 minutes ago
            await redis.zadd(setKey, oldTimestamp, `${jobData.projectId}:stale-job`)

            // The set has 1 member (at capacity), but the stale entry should be cleaned
            const result = await rateLimiterInterceptor.preDispatch({
                jobId: 'new-job',
                jobData,
                job: createMockJob(),
                log: mockLog,
            })
            expect(result.verdict).toBe(InterceptorVerdict.ALLOW)

            const members = await redis.zrange(setKey, 0, -1)
            // Only the new job should remain
            expect(members).toHaveLength(1)
            expect(members[0]).toBe(`${jobData.projectId}:new-job`)
        })
    })

    describe('limit resolution', () => {
        it('should use pool override when set for project', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 100
                return 0
            })
            const projectId = `proj-${crypto.randomUUID()}`
            const poolId = `pool-${crypto.randomUUID()}`
            const jobData = createFlowJobData({ projectId })

            // Map project to pool and set pool limit to 1
            await distributedStore.put(getProjectConcurrencyPoolKey(projectId), poolId)
            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), 1)

            await rateLimiterInterceptor.preDispatch({ jobId: 'job-1', jobData, job: createMockJob(), log: mockLog })
            const result = await rateLimiterInterceptor.preDispatch({ jobId: 'job-2', jobData, job: createMockJob(), log: mockLog })
            expect(result.verdict).toBe(InterceptorVerdict.REJECT)
        })

        it('should use plan limit on cloud edition', async () => {
            vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.CLOUD)
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 100
                return 0
            })
            const platformId = `plat-${crypto.randomUUID()}`
            const jobData = createFlowJobData({ platformId })

            // Set plan to STANDARD (limit=5)
            await distributedStore.put(getPlatformPlanNameKey(platformId), PlanName.STANDARD)

            // Fill 5 slots
            for (let i = 0; i < 5; i++) {
                const r = await rateLimiterInterceptor.preDispatch({ jobId: `job-${i}`, jobData, job: createMockJob(), log: mockLog })
                expect(r.verdict).toBe(InterceptorVerdict.ALLOW)
            }

            // 6th should be rejected
            const result = await rateLimiterInterceptor.preDispatch({ jobId: 'job-6', jobData, job: createMockJob(), log: mockLog })
            expect(result.verdict).toBe(InterceptorVerdict.REJECT)
        })

        it('should ignore plan on non-cloud edition', async () => {
            vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.COMMUNITY)
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 100
                return 0
            })
            const platformId = `plat-${crypto.randomUUID()}`
            const jobData = createFlowJobData({ platformId })

            // Set plan to STANDARD — should be ignored on COMMUNITY
            await distributedStore.put(getPlatformPlanNameKey(platformId), PlanName.STANDARD)

            // Should use default (100), so 6 jobs should all pass
            for (let i = 0; i < 6; i++) {
                const r = await rateLimiterInterceptor.preDispatch({ jobId: `job-${i}`, jobData, job: createMockJob(), log: mockLog })
                expect(r.verdict).toBe(InterceptorVerdict.ALLOW)
            }
        })

        it('should fall back to default system prop', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 2
                return 0
            })
            const jobData = createFlowJobData()

            // No project override, no plan → uses default of 2
            await rateLimiterInterceptor.preDispatch({ jobId: 'job-1', jobData, job: createMockJob(), log: mockLog })
            await rateLimiterInterceptor.preDispatch({ jobId: 'job-2', jobData, job: createMockJob(), log: mockLog })
            const result = await rateLimiterInterceptor.preDispatch({ jobId: 'job-3', jobData, job: createMockJob(), log: mockLog })
            expect(result.verdict).toBe(InterceptorVerdict.REJECT)
        })
    })

    describe('slot release (onJobFinished)', () => {
        it('should release slot for completed job', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 2
                return 0
            })
            const jobData = createFlowJobData()
            const jobId = 'release_test_1'

            await rateLimiterInterceptor.preDispatch({ jobId, jobData, job: createMockJob(), log: mockLog })

            const redis = await redisConnections.useExisting()
            let members = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(members).toHaveLength(1)

            await rateLimiterInterceptor.onJobFinished({ jobId, jobData, log: mockLog })

            members = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(members).toHaveLength(0)
        })

        it('should be a no-op when rate limiter is disabled', async () => {
            disableRateLimiter()
            const jobData = createFlowJobData()
            // Should not throw
            await rateLimiterInterceptor.onJobFinished({ jobId: 'job-1', jobData, log: mockLog })
        })

        it('should be idempotent', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 2
                return 0
            })
            const jobData = createFlowJobData()
            const jobId = 'idempotent_test_1'

            await rateLimiterInterceptor.preDispatch({ jobId, jobData, job: createMockJob(), log: mockLog })
            await rateLimiterInterceptor.onJobFinished({ jobId, jobData, log: mockLog })
            // Second release — should not throw
            await rateLimiterInterceptor.onJobFinished({ jobId, jobData, log: mockLog })

            const redis = await redisConnections.useExisting()
            const members = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(members).toHaveLength(0)
        })
    })

    describe('pool concurrency', () => {
        beforeEach(() => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 100
                return 0
            })
        })

        it('jobs from two projects in same pool count against shared limit', async () => {
            const poolId = `pool-${crypto.randomUUID()}`
            const projectIdA = `proj-pool-A-${crypto.randomUUID()}`
            const projectIdB = `proj-pool-B-${crypto.randomUUID()}`

            // Set up pool: limit=2, both projects mapped
            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), 2)
            await distributedStore.put(getProjectConcurrencyPoolKey(projectIdA), poolId)
            await distributedStore.put(getProjectConcurrencyPoolKey(projectIdB), poolId)

            const jobDataA = createFlowJobData({ projectId: projectIdA })
            const jobDataB = createFlowJobData({ projectId: projectIdB })

            // proj-A takes slot 1
            const r1 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-a1', jobData: jobDataA, job: createMockJob(), log: mockLog })
            expect(r1.verdict).toBe(InterceptorVerdict.ALLOW)

            // proj-B takes slot 2
            const r2 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-b1', jobData: jobDataB, job: createMockJob(), log: mockLog })
            expect(r2.verdict).toBe(InterceptorVerdict.ALLOW)

            // Pool is full — proj-A new job should be rejected
            const r3 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-a2', jobData: jobDataA, job: createMockJob(), log: mockLog })
            expect(r3.verdict).toBe(InterceptorVerdict.REJECT)

            // Pool is full — proj-B new job should also be rejected
            const r4 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-b2', jobData: jobDataB, job: createMockJob(), log: mockLog })
            expect(r4.verdict).toBe(InterceptorVerdict.REJECT)
        })

        it('pool at capacity does not block unrelated project', async () => {
            const poolId = `pool-${crypto.randomUUID()}`
            const projectIdA = `proj-pool-A-${crypto.randomUUID()}`
            const projectIdUnrelated = `proj-unrelated-${crypto.randomUUID()}`

            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), 1)
            await distributedStore.put(getProjectConcurrencyPoolKey(projectIdA), poolId)

            const jobDataA = createFlowJobData({ projectId: projectIdA })
            const jobDataUnrelated = createFlowJobData({ projectId: projectIdUnrelated })

            // Fill the pool
            await rateLimiterInterceptor.preDispatch({ jobId: 'job-a1', jobData: jobDataA, job: createMockJob(), log: mockLog })

            // Pool project is now at capacity
            const rejectA = await rateLimiterInterceptor.preDispatch({ jobId: 'job-a2', jobData: jobDataA, job: createMockJob(), log: mockLog })
            expect(rejectA.verdict).toBe(InterceptorVerdict.REJECT)

            // Unrelated project (no pool) should still be allowed
            const allowUnrelated = await rateLimiterInterceptor.preDispatch({ jobId: 'job-u1', jobData: jobDataUnrelated, job: createMockJob(), log: mockLog })
            expect(allowUnrelated.verdict).toBe(InterceptorVerdict.ALLOW)
        })

        it('same {projectId}:{jobId} member is deduped in pool ZSET', async () => {
            const poolId = `pool-${crypto.randomUUID()}`
            const projectIdA = `proj-dedup-${crypto.randomUUID()}`

            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), 2)
            await distributedStore.put(getProjectConcurrencyPoolKey(projectIdA), poolId)

            const jobData = createFlowJobData({ projectId: projectIdA })

            const r1 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-dup', jobData, job: createMockJob(), log: mockLog })
            expect(r1.verdict).toBe(InterceptorVerdict.ALLOW)

            // Same jobId dispatched again — should not add a duplicate
            const r2 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-dup', jobData, job: createMockJob(), log: mockLog })
            expect(r2.verdict).toBe(InterceptorVerdict.ALLOW)

            const redis = await redisConnections.useExisting()
            const members = await redis.zrange(getConcurrencyPoolSetKey(poolId), 0, -1)
            expect(members).toHaveLength(1)
        })

        it('releasing a pool slot frees space for another project in pool', async () => {
            const poolId = `pool-${crypto.randomUUID()}`
            const projectIdA = `proj-rel-A-${crypto.randomUUID()}`
            const projectIdB = `proj-rel-B-${crypto.randomUUID()}`

            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), 1)
            await distributedStore.put(getProjectConcurrencyPoolKey(projectIdA), poolId)
            await distributedStore.put(getProjectConcurrencyPoolKey(projectIdB), poolId)

            const jobDataA = createFlowJobData({ projectId: projectIdA })
            const jobDataB = createFlowJobData({ projectId: projectIdB })

            // proj-A fills the single slot
            await rateLimiterInterceptor.preDispatch({ jobId: 'job-a1', jobData: jobDataA, job: createMockJob(), log: mockLog })

            // proj-B is blocked
            const blocked = await rateLimiterInterceptor.preDispatch({ jobId: 'job-b1', jobData: jobDataB, job: createMockJob(), log: mockLog })
            expect(blocked.verdict).toBe(InterceptorVerdict.REJECT)

            // proj-A finishes — releases the slot
            await rateLimiterInterceptor.onJobFinished({ jobId: 'job-a1', jobData: jobDataA, log: mockLog })

            // proj-B can now proceed
            const allowed = await rateLimiterInterceptor.preDispatch({ jobId: 'job-b1', jobData: jobDataB, job: createMockJob(), log: mockLog })
            expect(allowed.verdict).toBe(InterceptorVerdict.ALLOW)
        })

        it('per-project pool: single-project pool limits that project via pool ZSET key', async () => {
            const projectId = `proj-fallback-${crypto.randomUUID()}`
            const poolId = `pool-${crypto.randomUUID()}`
            const jobData = createFlowJobData({ projectId })

            // Map project to a solo pool and set the pool limit
            await distributedStore.put(getProjectConcurrencyPoolKey(projectId), poolId)
            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), 1)

            const r1 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-1', jobData, job: createMockJob(), log: mockLog })
            expect(r1.verdict).toBe(InterceptorVerdict.ALLOW)

            // Slot is taken — second job rejected
            const r2 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-2', jobData, job: createMockJob(), log: mockLog })
            expect(r2.verdict).toBe(InterceptorVerdict.REJECT)

            // Verify ZSET key is based on poolId, not projectId
            const redis = await redisConnections.useExisting()
            const members = await redis.zrange(getConcurrencyPoolSetKey(poolId), 0, -1)
            expect(members).toHaveLength(1)
            expect(members[0]).toBe(`${projectId}:job-1`)
        })
    })
})
