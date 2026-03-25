import { ApEdition, ExecutionType, JOB_PRIORITY, PlanName, ProgressUpdateType, RATE_LIMIT_PRIORITY, RunEnvironment, WorkerJobType } from '@activepieces/shared'
import { Job } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProjectMaxConcurrentJobsKey, getPlatformPlanNameKey } from '../../../../../../src/app/database/redis/keys'
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

describe('rateLimiterInterceptor', () => {
    beforeEach(async () => {
        vi.restoreAllMocks()
        enableRateLimiter()
        vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
            if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
            if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 100
            return 0
        })
        vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.COMMUNITY)

        const redis = await redisConnections.useExisting()
        const keys = await redis.keys('active_jobs_set:*')
        if (keys.length > 0) {
            await redis.del(...keys)
        }
        const projectKeys = await redis.keys('project:max-concurrent-jobs:*')
        if (projectKeys.length > 0) {
            await redis.del(...projectKeys)
        }
        const planKeys = await redis.keys('platform_plan:plan:*')
        if (planKeys.length > 0) {
            await redis.del(...planKeys)
        }
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
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 2
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
            const members = await redis.smembers(`active_jobs_set:${jobData.projectId}`)
            expect(members).toHaveLength(1)
            expect(members[0]).toMatch(/^job-1:/)
        })

        it('should ALLOW up to max concurrent jobs', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 3
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
            const members = await redis.smembers(`active_jobs_set:${jobData.projectId}`)
            expect(members).toHaveLength(3)
        })

        it('should REJECT when at capacity', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 2
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
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 2
                return 0
            })
            const jobData = createFlowJobData()

            const r1 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-same', jobData, job: createMockJob(), log: mockLog })
            expect(r1.verdict).toBe(InterceptorVerdict.ALLOW)

            // Dispatch same jobId again — Lua dedup returns 0 (allowed) without adding duplicate
            const r2 = await rateLimiterInterceptor.preDispatch({ jobId: 'job-same', jobData, job: createMockJob(), log: mockLog })
            expect(r2.verdict).toBe(InterceptorVerdict.ALLOW)

            const redis = await redisConnections.useExisting()
            const members = await redis.smembers(`active_jobs_set:${jobData.projectId}`)
            expect(members).toHaveLength(1)
        })

        it('should not let different projects interfere', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 1
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
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 1
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
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 1
                return 0
            })
            const jobData = createFlowJobData()
            const setKey = `active_jobs_set:${jobData.projectId}`

            // Manually insert a stale entry with an old timestamp
            const redis = await redisConnections.useExisting()
            const oldTimestamp = Date.now() - 120_000 // 2 minutes ago
            await redis.sadd(setKey, `stale-job:${oldTimestamp}`)

            // The set has 1 member (at capacity), but the stale entry should be cleaned
            const result = await rateLimiterInterceptor.preDispatch({
                jobId: 'new-job',
                jobData,
                job: createMockJob(),
                log: mockLog,
            })
            expect(result.verdict).toBe(InterceptorVerdict.ALLOW)

            const members = await redis.smembers(setKey)
            // Only the new job should remain
            expect(members).toHaveLength(1)
            expect(members[0]).toMatch(/^new-job:/)
        })
    })

    describe('limit resolution', () => {
        it('should use project override when set', async () => {
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 100
                return 0
            })
            const projectId = `proj-${crypto.randomUUID()}`
            const jobData = createFlowJobData({ projectId })

            // Set project override to 1
            await distributedStore.put(getProjectMaxConcurrentJobsKey(projectId), 1)

            await rateLimiterInterceptor.preDispatch({ jobId: 'job-1', jobData, job: createMockJob(), log: mockLog })
            const result = await rateLimiterInterceptor.preDispatch({ jobId: 'job-2', jobData, job: createMockJob(), log: mockLog })
            expect(result.verdict).toBe(InterceptorVerdict.REJECT)
        })

        it('should use plan limit on cloud edition', async () => {
            vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.CLOUD)
            vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
                if (prop === AppSystemProp.FLOW_TIMEOUT_SECONDS) return 600
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 100
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
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 100
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
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 2
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
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 2
                return 0
            })
            const jobData = createFlowJobData()
            const jobId = 'release_test_1'

            await rateLimiterInterceptor.preDispatch({ jobId, jobData, job: createMockJob(), log: mockLog })

            const redis = await redisConnections.useExisting()
            let members = await redis.smembers(`active_jobs_set:${jobData.projectId}`)
            expect(members).toHaveLength(1)

            await rateLimiterInterceptor.onJobFinished({ jobId, jobData, log: mockLog })

            members = await redis.smembers(`active_jobs_set:${jobData.projectId}`)
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
                if (prop === AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT) return 2
                return 0
            })
            const jobData = createFlowJobData()
            const jobId = 'idempotent_test_1'

            await rateLimiterInterceptor.preDispatch({ jobId, jobData, job: createMockJob(), log: mockLog })
            await rateLimiterInterceptor.onJobFinished({ jobId, jobData, log: mockLog })
            // Second release — should not throw
            await rateLimiterInterceptor.onJobFinished({ jobId, jobData, log: mockLog })

            const redis = await redisConnections.useExisting()
            const members = await redis.smembers(`active_jobs_set:${jobData.projectId}`)
            expect(members).toHaveLength(0)
        })
    })
})
