import { ApEdition, ExecuteFlowJobData, ExecutionType, JOB_PRIORITY, PlanName, RATE_LIMIT_PRIORITY, RunEnvironment, StreamStepProgress, WorkerJobType } from '@activepieces/shared'
import { Job } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { Redis } from 'ioredis'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getConcurrencyPoolLimitKey, getConcurrencyPoolSetKey, getConcurrencyPoolWaitlistKey, getPlatformPlanNameKey, getProjectConcurrencyPoolKey } from '../../../../../../src/app/database/redis/keys'
import { distributedStore, redisConnections } from '../../../../../../src/app/database/redis-connections'
import { system } from '../../../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../../../src/app/helper/system/system-props'
import { rateLimiterInterceptor } from '../../../../../../src/app/workers/job-queue/interceptors/rate-limiter-interceptor'
import { InterceptorVerdict } from '../../../../../../src/app/workers/job-queue/job-interceptor'
import * as jobQueueModule from '../../../../../../src/app/workers/job-queue/job-queue'

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

const FLOW_TIMEOUT_SECONDS = 600
const EXPECTED_SAFETY_NET_DELAY_MS = (FLOW_TIMEOUT_SECONDS * 1000) + 60_000 + 60_000

function createFlowJobData(overrides?: Record<string, unknown>): ExecuteFlowJobData {
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
        streamStepProgress: StreamStepProgress.NONE,
        payload: {},
        logsUploadUrl: 'http://localhost/logs',
        logsFileId: 'log-file-id',
        ...overrides,
    } as unknown as ExecuteFlowJobData
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

function installPromoteJobMock(returnValue = true) {
    const promoteJob = vi.fn().mockResolvedValue(returnValue)
    vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation(() => ({
        promoteJob,
    } as unknown as ReturnType<typeof jobQueueModule.jobQueue>))
    return promoteJob
}

describe('rateLimiterInterceptor', () => {
    beforeEach(async () => {
        vi.restoreAllMocks()
        enableRateLimiter()
        vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
            if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
            if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 100
            return 0
        })
        vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.COMMUNITY)
        installPromoteJobMock(true)

        const redis = await redisConnections.useExisting()
        await deleteKeysByPattern(redis, 'active_jobs_set:*')
        await deleteKeysByPattern(redis, 'waiting_jobs_list:*')
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

        it('should not hit Redis when rate limiter is disabled on finish', async () => {
            disableRateLimiter()
            const promoteJob = installPromoteJobMock(true)
            const jobData = createFlowJobData()
            await rateLimiterInterceptor.onJobFinished({ jobId: 'job-1', jobData, failed: false, log: mockLog })
            expect(promoteJob).not.toHaveBeenCalled()
        })
    })

    describe('slot acquisition', () => {
        it('should ALLOW first job when under limit', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
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
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
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

        it('should REJECT with safety-net delay and push to waitlist when at capacity', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
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
                expect(result.delayInMs).toBe(EXPECTED_SAFETY_NET_DELAY_MS)
                expect(result.priority).toBe(JOB_PRIORITY[RATE_LIMIT_PRIORITY])
            }

            const redis = await redisConnections.useExisting()
            const waiters = await redis.lrange(getConcurrencyPoolWaitlistKey(jobData.projectId), 0, -1)
            expect(waiters).toEqual([`${jobData.projectId}:job-3`])
        })

        it('should use a fixed safety-net delay regardless of attemptsMade', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 1
                return 0
            })
            const jobData = createFlowJobData()
            await rateLimiterInterceptor.preDispatch({ jobId: 'fill', jobData, job: createMockJob(), log: mockLog })

            for (const attemptsMade of [0, 1, 5, 100]) {
                const result = await rateLimiterInterceptor.preDispatch({
                    jobId: `wait-${attemptsMade}`,
                    jobData,
                    job: createMockJob({ attemptsMade }),
                    log: mockLog,
                })
                expect(result.verdict).toBe(InterceptorVerdict.REJECT)
                if (result.verdict === InterceptorVerdict.REJECT) {
                    expect(result.delayInMs).toBe(EXPECTED_SAFETY_NET_DELAY_MS)
                }
            }
        })

        it('should not double-count the same jobId', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 2
                return 0
            })
            const jobData = createFlowJobData()

            const r1 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-same', jobData, job: createMockJob(), log: mockLog })
            expect(r1.verdict).toBe(InterceptorVerdict.ALLOW)

            const r2 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-same', jobData, job: createMockJob(), log: mockLog })
            expect(r2.verdict).toBe(InterceptorVerdict.ALLOW)

            const redis = await redisConnections.useExisting()
            const members = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(members).toHaveLength(1)
            const waiters = await redis.lrange(getConcurrencyPoolWaitlistKey(jobData.projectId), 0, -1)
            expect(waiters).toEqual([])
        })

        it('should not let different projects interfere', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 1
                return 0
            })
            const jobDataA = createFlowJobData({ projectId: 'proj-A' })
            const jobDataB = createFlowJobData({ projectId: 'proj-B' })

            await rateLimiterInterceptor.preDispatch({ jobId: 'job-a', jobData: jobDataA, job: createMockJob(), log: mockLog })

            const rejectA = await rateLimiterInterceptor.preDispatch({ jobId: 'job-a2', jobData: jobDataA, job: createMockJob(), log: mockLog })
            expect(rejectA.verdict).toBe(InterceptorVerdict.REJECT)

            const allowB = await rateLimiterInterceptor.preDispatch({ jobId: 'job-b', jobData: jobDataB, job: createMockJob(), log: mockLog })
            expect(allowB.verdict).toBe(InterceptorVerdict.ALLOW)
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

            const redis = await redisConnections.useExisting()
            const oldTimestamp = Date.now() - 120_000
            await redis.zadd(setKey, oldTimestamp, `${jobData.projectId}:stale-job`)

            const result = await rateLimiterInterceptor.preDispatch({
                jobId: 'new-job',
                jobData,
                job: createMockJob(),
                log: mockLog,
            })
            expect(result.verdict).toBe(InterceptorVerdict.ALLOW)

            const members = await redis.zrange(setKey, 0, -1)
            expect(members).toHaveLength(1)
            expect(members[0]).toBe(`${jobData.projectId}:new-job`)
        })
    })

    describe('limit resolution', () => {
        it('should use pool override when set for project', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 100
                return 0
            })
            const projectId = `proj-${crypto.randomUUID()}`
            const poolId = `pool-${crypto.randomUUID()}`
            const jobData = createFlowJobData({ projectId })

            await distributedStore.put(getProjectConcurrencyPoolKey(projectId), poolId)
            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), 1)

            await rateLimiterInterceptor.preDispatch({ jobId: 'job-1', jobData, job: createMockJob(), log: mockLog })
            const result = await rateLimiterInterceptor.preDispatch({ jobId: 'job-2', jobData, job: createMockJob(), log: mockLog })
            expect(result.verdict).toBe(InterceptorVerdict.REJECT)
        })

        it('should use plan limit on cloud edition', async () => {
            vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.CLOUD)
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 100
                return 0
            })
            const platformId = `plat-${crypto.randomUUID()}`
            const jobData = createFlowJobData({ platformId })

            await distributedStore.put(getPlatformPlanNameKey(platformId), PlanName.STANDARD)

            for (let i = 0; i < 5; i++) {
                const r = await rateLimiterInterceptor.preDispatch({ jobId: `job-${i}`, jobData, job: createMockJob(), log: mockLog })
                expect(r.verdict).toBe(InterceptorVerdict.ALLOW)
            }

            const result = await rateLimiterInterceptor.preDispatch({ jobId: 'job-6', jobData, job: createMockJob(), log: mockLog })
            expect(result.verdict).toBe(InterceptorVerdict.REJECT)
        })

        it('should ignore plan on non-cloud edition', async () => {
            vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.COMMUNITY)
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 100
                return 0
            })
            const platformId = `plat-${crypto.randomUUID()}`
            const jobData = createFlowJobData({ platformId })

            await distributedStore.put(getPlatformPlanNameKey(platformId), PlanName.STANDARD)

            for (let i = 0; i < 6; i++) {
                const r = await rateLimiterInterceptor.preDispatch({ jobId: `job-${i}`, jobData, job: createMockJob(), log: mockLog })
                expect(r.verdict).toBe(InterceptorVerdict.ALLOW)
            }
        })

        it('should fall back to default system prop', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 2
                return 0
            })
            const jobData = createFlowJobData()

            await rateLimiterInterceptor.preDispatch({ jobId: 'job-1', jobData, job: createMockJob(), log: mockLog })
            await rateLimiterInterceptor.preDispatch({ jobId: 'job-2', jobData, job: createMockJob(), log: mockLog })
            const result = await rateLimiterInterceptor.preDispatch({ jobId: 'job-3', jobData, job: createMockJob(), log: mockLog })
            expect(result.verdict).toBe(InterceptorVerdict.REJECT)
        })
    })

    describe('slot release (onJobFinished)', () => {
        it('should release slot for completed job when no waiters', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 2
                return 0
            })
            const promoteJob = installPromoteJobMock(true)
            const jobData = createFlowJobData()
            const jobId = 'release_test_1'

            await rateLimiterInterceptor.preDispatch({ jobId, jobData, job: createMockJob(), log: mockLog })

            const redis = await redisConnections.useExisting()
            let members = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(members).toHaveLength(1)

            await rateLimiterInterceptor.onJobFinished({ jobId, jobData, failed: false, log: mockLog })

            members = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(members).toHaveLength(0)
            expect(promoteJob).not.toHaveBeenCalled()
        })

        it('should be a no-op when rate limiter is disabled', async () => {
            disableRateLimiter()
            const jobData = createFlowJobData()
            await rateLimiterInterceptor.onJobFinished({ jobId: 'job-1', jobData, failed: false, log: mockLog })
        })

        it('should be idempotent on double-release', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 2
                return 0
            })
            const jobData = createFlowJobData()
            const jobId = 'idempotent_test_1'

            await rateLimiterInterceptor.preDispatch({ jobId, jobData, job: createMockJob(), log: mockLog })
            await rateLimiterInterceptor.onJobFinished({ jobId, jobData, failed: false, log: mockLog })
            await rateLimiterInterceptor.onJobFinished({ jobId, jobData, failed: false, log: mockLog })

            const redis = await redisConnections.useExisting()
            const members = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(members).toHaveLength(0)
        })
    })

    describe('waitlist promote-on-release', () => {
        it('promotes the oldest waiter via jobQueue.promoteJob when slot frees', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 1
                return 0
            })
            const promoteJob = installPromoteJobMock(true)
            const jobData = createFlowJobData()

            const r1 = await rateLimiterInterceptor.preDispatch({ jobId: 'active', jobData, job: createMockJob(), log: mockLog })
            expect(r1.verdict).toBe(InterceptorVerdict.ALLOW)

            const r2 = await rateLimiterInterceptor.preDispatch({ jobId: 'waiter-1', jobData, job: createMockJob(), log: mockLog })
            const r3 = await rateLimiterInterceptor.preDispatch({ jobId: 'waiter-2', jobData, job: createMockJob(), log: mockLog })
            expect(r2.verdict).toBe(InterceptorVerdict.REJECT)
            expect(r3.verdict).toBe(InterceptorVerdict.REJECT)

            const redis = await redisConnections.useExisting()
            expect(await redis.llen(getConcurrencyPoolWaitlistKey(jobData.projectId))).toBe(2)

            await rateLimiterInterceptor.onJobFinished({ jobId: 'active', jobData, failed: false, log: mockLog })

            expect(promoteJob).toHaveBeenCalledTimes(1)
            expect(promoteJob).toHaveBeenCalledWith({ jobId: 'waiter-1', platformId: jobData.platformId })

            const activeMembers = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(activeMembers).toHaveLength(1)
            expect(activeMembers[0]).toBe(`${jobData.projectId}:waiter-1`)

            const remainingWaiters = await redis.lrange(getConcurrencyPoolWaitlistKey(jobData.projectId), 0, -1)
            expect(remainingWaiters).toEqual([`${jobData.projectId}:waiter-2`])
        })

        it('rollsback slot reservation when promote fails', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 1
                return 0
            })
            const promoteJob = installPromoteJobMock(false)
            const jobData = createFlowJobData()

            await rateLimiterInterceptor.preDispatch({ jobId: 'active', jobData, job: createMockJob(), log: mockLog })
            await rateLimiterInterceptor.preDispatch({ jobId: 'waiter-1', jobData, job: createMockJob(), log: mockLog })

            await rateLimiterInterceptor.onJobFinished({ jobId: 'active', jobData, failed: false, log: mockLog })

            expect(promoteJob).toHaveBeenCalledTimes(1)

            const redis = await redisConnections.useExisting()
            const activeMembers = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(activeMembers).toHaveLength(0)

            const remainingWaiters = await redis.lrange(getConcurrencyPoolWaitlistKey(jobData.projectId), 0, -1)
            expect(remainingWaiters).toEqual([`${jobData.projectId}:waiter-1`])
        })

        it('does not call promoteJob when waitlist is empty on release', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 2
                return 0
            })
            const promoteJob = installPromoteJobMock(true)
            const jobData = createFlowJobData()

            await rateLimiterInterceptor.preDispatch({ jobId: 'active', jobData, job: createMockJob(), log: mockLog })
            await rateLimiterInterceptor.onJobFinished({ jobId: 'active', jobData, failed: false, log: mockLog })

            expect(promoteJob).not.toHaveBeenCalled()
        })

        it('releases slot + promotes in single atomic step across two back-to-back finishes', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 2
                return 0
            })
            const promoteJob = installPromoteJobMock(true)
            const jobData = createFlowJobData()

            await rateLimiterInterceptor.preDispatch({ jobId: 'a1', jobData, job: createMockJob(), log: mockLog })
            await rateLimiterInterceptor.preDispatch({ jobId: 'a2', jobData, job: createMockJob(), log: mockLog })
            await rateLimiterInterceptor.preDispatch({ jobId: 'w1', jobData, job: createMockJob(), log: mockLog })
            await rateLimiterInterceptor.preDispatch({ jobId: 'w2', jobData, job: createMockJob(), log: mockLog })

            const redis = await redisConnections.useExisting()
            expect(await redis.llen(getConcurrencyPoolWaitlistKey(jobData.projectId))).toBe(2)

            await rateLimiterInterceptor.onJobFinished({ jobId: 'a1', jobData, failed: false, log: mockLog })
            await rateLimiterInterceptor.onJobFinished({ jobId: 'a2', jobData, failed: false, log: mockLog })

            expect(promoteJob).toHaveBeenCalledTimes(2)
            expect(promoteJob).toHaveBeenNthCalledWith(1, { jobId: 'w1', platformId: jobData.platformId })
            expect(promoteJob).toHaveBeenNthCalledWith(2, { jobId: 'w2', platformId: jobData.platformId })

            expect(await redis.llen(getConcurrencyPoolWaitlistKey(jobData.projectId))).toBe(0)
            const activeMembers = await redis.zrange(getConcurrencyPoolSetKey(jobData.projectId), 0, -1)
            expect(new Set(activeMembers)).toEqual(new Set([`${jobData.projectId}:w1`, `${jobData.projectId}:w2`]))
        })
    })

    describe('pool concurrency', () => {
        beforeEach(() => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return FLOW_TIMEOUT_SECONDS
                if (prop === AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT) return 100
                return 0
            })
        })

        it('jobs from two projects in same pool count against shared limit', async () => {
            const poolId = `pool-${crypto.randomUUID()}`
            const projectIdA = `proj-pool-A-${crypto.randomUUID()}`
            const projectIdB = `proj-pool-B-${crypto.randomUUID()}`

            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), 2)
            await distributedStore.put(getProjectConcurrencyPoolKey(projectIdA), poolId)
            await distributedStore.put(getProjectConcurrencyPoolKey(projectIdB), poolId)

            const jobDataA = createFlowJobData({ projectId: projectIdA })
            const jobDataB = createFlowJobData({ projectId: projectIdB })

            const r1 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-a1', jobData: jobDataA, job: createMockJob(), log: mockLog })
            expect(r1.verdict).toBe(InterceptorVerdict.ALLOW)

            const r2 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-b1', jobData: jobDataB, job: createMockJob(), log: mockLog })
            expect(r2.verdict).toBe(InterceptorVerdict.ALLOW)

            const r3 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-a2', jobData: jobDataA, job: createMockJob(), log: mockLog })
            expect(r3.verdict).toBe(InterceptorVerdict.REJECT)

            const r4 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-b2', jobData: jobDataB, job: createMockJob(), log: mockLog })
            expect(r4.verdict).toBe(InterceptorVerdict.REJECT)

            const redis = await redisConnections.useExisting()
            const waiters = await redis.lrange(getConcurrencyPoolWaitlistKey(poolId), 0, -1)
            expect(waiters).toEqual([`${projectIdA}:job-a2`, `${projectIdB}:job-b2`])
        })

        it('pool at capacity does not block unrelated project', async () => {
            const poolId = `pool-${crypto.randomUUID()}`
            const projectIdA = `proj-pool-A-${crypto.randomUUID()}`
            const projectIdUnrelated = `proj-unrelated-${crypto.randomUUID()}`

            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), 1)
            await distributedStore.put(getProjectConcurrencyPoolKey(projectIdA), poolId)

            const jobDataA = createFlowJobData({ projectId: projectIdA })
            const jobDataUnrelated = createFlowJobData({ projectId: projectIdUnrelated })

            await rateLimiterInterceptor.preDispatch({ jobId: 'job-a1', jobData: jobDataA, job: createMockJob(), log: mockLog })

            const rejectA = await rateLimiterInterceptor.preDispatch({ jobId: 'job-a2', jobData: jobDataA, job: createMockJob(), log: mockLog })
            expect(rejectA.verdict).toBe(InterceptorVerdict.REJECT)

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

            const r2 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-dup', jobData, job: createMockJob(), log: mockLog })
            expect(r2.verdict).toBe(InterceptorVerdict.ALLOW)

            const redis = await redisConnections.useExisting()
            const members = await redis.zrange(getConcurrencyPoolSetKey(poolId), 0, -1)
            expect(members).toHaveLength(1)
        })

        it('releasing a pool slot promotes waiter from another project', async () => {
            const promoteJob = installPromoteJobMock(true)
            const poolId = `pool-${crypto.randomUUID()}`
            const projectIdA = `proj-rel-A-${crypto.randomUUID()}`
            const projectIdB = `proj-rel-B-${crypto.randomUUID()}`

            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), 1)
            await distributedStore.put(getProjectConcurrencyPoolKey(projectIdA), poolId)
            await distributedStore.put(getProjectConcurrencyPoolKey(projectIdB), poolId)

            const jobDataA = createFlowJobData({ projectId: projectIdA })
            const jobDataB = createFlowJobData({ projectId: projectIdB })

            await rateLimiterInterceptor.preDispatch({ jobId: 'job-a1', jobData: jobDataA, job: createMockJob(), log: mockLog })

            const blocked = await rateLimiterInterceptor.preDispatch({ jobId: 'job-b1', jobData: jobDataB, job: createMockJob(), log: mockLog })
            expect(blocked.verdict).toBe(InterceptorVerdict.REJECT)

            await rateLimiterInterceptor.onJobFinished({ jobId: 'job-a1', jobData: jobDataA, failed: false, log: mockLog })

            expect(promoteJob).toHaveBeenCalledTimes(1)
            expect(promoteJob).toHaveBeenCalledWith({ jobId: 'job-b1', platformId: jobDataA.platformId })

            const redis = await redisConnections.useExisting()
            const members = await redis.zrange(getConcurrencyPoolSetKey(poolId), 0, -1)
            expect(members).toHaveLength(1)
            expect(members[0]).toBe(`${projectIdB}:job-b1`)
        })

        it('per-project pool: single-project pool limits that project via pool ZSET key', async () => {
            const projectId = `proj-fallback-${crypto.randomUUID()}`
            const poolId = `pool-${crypto.randomUUID()}`
            const jobData = createFlowJobData({ projectId })

            await distributedStore.put(getProjectConcurrencyPoolKey(projectId), poolId)
            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), 1)

            const r1 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-1', jobData, job: createMockJob(), log: mockLog })
            expect(r1.verdict).toBe(InterceptorVerdict.ALLOW)

            const r2 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-2', jobData, job: createMockJob(), log: mockLog })
            expect(r2.verdict).toBe(InterceptorVerdict.REJECT)

            const redis = await redisConnections.useExisting()
            const members = await redis.zrange(getConcurrencyPoolSetKey(poolId), 0, -1)
            expect(members).toHaveLength(1)
            expect(members[0]).toBe(`${projectId}:job-1`)
        })
    })
})
