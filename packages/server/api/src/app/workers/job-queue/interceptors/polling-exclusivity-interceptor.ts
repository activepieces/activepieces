import { JobData, PollingJobData, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getPollingExclusivityKey } from '../../../database/redis/keys'
import { redisConnections } from '../../../database/redis-connections'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { InterceptorResult, InterceptorVerdict, JobInterceptor } from '../job-interceptor'

const RETRY_DELAY_MS = 10_000
const LOCK_SAFETY_MARGIN_SECONDS = 60

function isPollingJob(jobData: JobData): jobData is PollingJobData {
    return jobData.jobType === WorkerJobType.EXECUTE_POLLING
}

function getLockTtlSeconds(): number {
    return system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS) + LOCK_SAFETY_MARGIN_SECONDS
}

async function tryAcquireLock({ flowVersionId, jobId }: { flowVersionId: string, jobId: string }): Promise<boolean> {
    const redis = await redisConnections.useExisting()
    const result = await redis.set(getPollingExclusivityKey(flowVersionId), jobId, 'EX', getLockTtlSeconds(), 'NX')
    return result !== null
}

async function releaseLock({ flowVersionId, jobId }: { flowVersionId: string, jobId: string }): Promise<void> {
    const redis = await redisConnections.useExisting()
    const key = getPollingExclusivityKey(flowVersionId)
    const owner = await redis.get(key)
    if (owner === jobId) {
        await redis.del(key)
    }
}

export const pollingExclusivityInterceptor: JobInterceptor = {
    async preDispatch({ jobId, jobData, log }: { jobId: string, jobData: JobData, log: FastifyBaseLogger }): Promise<InterceptorResult> {
        if (!isPollingJob(jobData)) {
            return { verdict: InterceptorVerdict.ALLOW }
        }
        const { flowVersionId } = jobData
        const acquired = await tryAcquireLock({ flowVersionId, jobId })
        if (acquired) {
            log.debug({ job: { id: jobId }, flowVersion: { id: flowVersionId } }, '[pollingExclusivityInterceptor] Lock acquired')
            return { verdict: InterceptorVerdict.ALLOW }
        }
        log.info({ job: { id: jobId }, flowVersion: { id: flowVersionId } }, '[pollingExclusivityInterceptor] A poll is already in flight for this flow version, deferring')
        return { verdict: InterceptorVerdict.REJECT, delayInMs: RETRY_DELAY_MS }
    },

    async onJobFinished({ jobId, jobData, log }: { jobId: string, jobData: JobData, failed: boolean, log: FastifyBaseLogger }): Promise<void> {
        if (!isPollingJob(jobData)) {
            return
        }
        const { flowVersionId } = jobData
        await releaseLock({ flowVersionId, jobId })
        log.debug({ job: { id: jobId }, flowVersion: { id: flowVersionId } }, '[pollingExclusivityInterceptor] Lock released')
    },
}
