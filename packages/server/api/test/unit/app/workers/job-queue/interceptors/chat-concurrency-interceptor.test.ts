import { WorkerJobType } from '@activepieces/shared'
import { Job } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getChatConcurrencySetKey } from '../../../../../../src/app/database/redis/keys'
import { redisConnections } from '../../../../../../src/app/database/redis-connections'
import { system } from '../../../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../../../src/app/helper/system/system-props'
import { chatConcurrencyInterceptor } from '../../../../../../src/app/workers/job-queue/interceptors/chat-concurrency-interceptor'
import { InterceptorVerdict } from '../../../../../../src/app/workers/job-queue/job-interceptor'

const mockLog = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as FastifyBaseLogger

function chatJob(overrides?: Record<string, unknown>) {
    return { jobType: WorkerJobType.EXECUTE_CHAT_AGENT, ...overrides } as never
}

function mockJob(overrides?: Record<string, unknown>) {
    return { attemptsMade: 0, ...overrides } as unknown as Job
}

function setLimit(limit: number) {
    vi.spyOn(system, 'getNumber').mockImplementation((prop) => (prop === AppSystemProp.CHAT_CONCURRENCY_LIMIT ? limit : null))
}

describe('chatConcurrencyInterceptor', () => {
    beforeEach(async () => {
        vi.restoreAllMocks()
        const redis = await redisConnections.useExisting()
        await redis.del(getChatConcurrencySetKey())
    })

    it('ALLOWs a non-chat job regardless of limit', async () => {
        setLimit(1)
        const result = await chatConcurrencyInterceptor.preDispatch({ jobId: 'j1', jobData: chatJob({ jobType: WorkerJobType.EXECUTE_FLOW }), job: mockJob(), log: mockLog })
        expect(result.verdict).toBe(InterceptorVerdict.ALLOW)
    })

    it('is a no-op (ALLOW, no slot taken) when the limit is 0', async () => {
        setLimit(0)
        const result = await chatConcurrencyInterceptor.preDispatch({ jobId: 'j1', jobData: chatJob(), job: mockJob(), log: mockLog })
        expect(result.verdict).toBe(InterceptorVerdict.ALLOW)
        const redis = await redisConnections.useExisting()
        expect(await redis.zcard(getChatConcurrencySetKey())).toBe(0)
    })

    it('ALLOWs up to the limit then REJECTs with backoff', async () => {
        setLimit(2)
        expect((await chatConcurrencyInterceptor.preDispatch({ jobId: 'j1', jobData: chatJob(), job: mockJob(), log: mockLog })).verdict).toBe(InterceptorVerdict.ALLOW)
        expect((await chatConcurrencyInterceptor.preDispatch({ jobId: 'j2', jobData: chatJob(), job: mockJob(), log: mockLog })).verdict).toBe(InterceptorVerdict.ALLOW)
        const rejected = await chatConcurrencyInterceptor.preDispatch({ jobId: 'j3', jobData: chatJob(), job: mockJob(), log: mockLog })
        expect(rejected.verdict).toBe(InterceptorVerdict.REJECT)
        if (rejected.verdict === InterceptorVerdict.REJECT) {
            expect(rejected.delayInMs).toBe(20_000)
        }
    })

    it('does not double-count the same jobId', async () => {
        setLimit(2)
        await chatConcurrencyInterceptor.preDispatch({ jobId: 'same', jobData: chatJob(), job: mockJob(), log: mockLog })
        await chatConcurrencyInterceptor.preDispatch({ jobId: 'same', jobData: chatJob(), job: mockJob(), log: mockLog })
        const redis = await redisConnections.useExisting()
        expect(await redis.zcard(getChatConcurrencySetKey())).toBe(1)
    })

    it('releases the slot on job finish, freeing capacity', async () => {
        setLimit(1)
        await chatConcurrencyInterceptor.preDispatch({ jobId: 'j1', jobData: chatJob(), job: mockJob(), log: mockLog })
        expect((await chatConcurrencyInterceptor.preDispatch({ jobId: 'j2', jobData: chatJob(), job: mockJob(), log: mockLog })).verdict).toBe(InterceptorVerdict.REJECT)
        await chatConcurrencyInterceptor.onJobFinished({ jobId: 'j1', jobData: chatJob(), failed: false, log: mockLog })
        expect((await chatConcurrencyInterceptor.preDispatch({ jobId: 'j2', jobData: chatJob(), job: mockJob(), log: mockLog })).verdict).toBe(InterceptorVerdict.ALLOW)
    })
})
