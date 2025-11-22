import { apDayjsDuration, getPlatformPlanNameKey, QueueName } from '@activepieces/server-shared'
import {
    ApEdition,
    assertNotNullOrUndefined,
    ExecuteFlowJobData,
    isNil,
    JobData,
    PlanName,
    PlatformId,
    RunEnvironment,
    WorkerJobType,
} from '@activepieces/shared'
import { Queue } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../utils/machine'
import { workerDistributedLock, workerDistributedStore, workerRedisConnections } from '../utils/worker-redis'

export const RATE_LIMIT_WORKER_JOB_TYPES = [WorkerJobType.EXECUTE_FLOW]
const projectActiveSetKey = (projectId: string): string => `active_jobs_set_2:${projectId}`
const projectWaitingSetKey = (projectId: string): string => `waiting_jobs_set:${projectId}`
const projectWaitingKeyLock = (projectId: string): string => `lock:waiting_jobs_set:${projectId}`
let throttledJobQueue: Queue<JobData> | undefined

export const workerJobRateLimiter = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        throttledJobQueue = new Queue<JobData>(QueueName.THROTTLED_JOBS, {
            connection: await workerRedisConnections.create(),
            telemetry: workerMachine.getSettings().OTEL_ENABLED ? new BullMQOtel(QueueName.THROTTLED_JOBS) : undefined,
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: apDayjsDuration(8, 'minute').asMilliseconds(),
                },
                removeOnComplete: true,
                removeOnFail: {
                    age: apDayjsDuration(30, 'day').asSeconds(),
                },
            },
        })
        await throttledJobQueue.waitUntilReady()

    },
    async throttleJob(id: string, data: JobData): Promise<void> {
        const redis = await workerRedisConnections.useExisting()
        const projectId = data.projectId
        assertNotNullOrUndefined(projectId, 'projectId')
        const waitingSetKey = projectWaitingSetKey(projectId)
        await workerDistributedLock(log).runExclusive({
            key: projectWaitingKeyLock(projectId),
            timeoutInSeconds: 20,
            fn: async () => {
                await redis.zadd(waitingSetKey, Date.now(), id)
                await getThrottledJobQueue().add(id, data, { jobId: id, delay: dayjs.duration(365, 'day').asMilliseconds() })
            },
        })
    },
    async close(): Promise<void> {
        if (!isNil(throttledJobQueue)) {
            await throttledJobQueue.close()
        }
    },
    async onCompleteOrFailedJob(data: JobData, jobId: string | undefined): Promise<void> {
        const projectRateLimiterEnabled = workerMachine.getSettings().PROJECT_RATE_LIMITER_ENABLED
        if (!RATE_LIMIT_WORKER_JOB_TYPES.includes(data.jobType) || !projectRateLimiterEnabled || isNil(jobId)) {
            return
        }
        const castedJob = data as ExecuteFlowJobData
        if (castedJob.environment === RunEnvironment.TESTING) {
            return
        }

        const redis = await workerRedisConnections.useExisting()
        const projectId = castedJob.projectId

        const waitingSetKey = projectWaitingSetKey(projectId)
        const waitingSize = await redis.zcard(waitingSetKey)
        if (waitingSize === 0) {
            return
        }

        await workerDistributedLock(log).runExclusive({
            key: projectWaitingKeyLock(projectId),
            timeoutInSeconds: 20,
            fn: async () => {
                const [nextJobId] = await redis.zrange(waitingSetKey, 0, 0)
                if (isNil(nextJobId)) {
                    return
                }
                const nextJob = await getThrottledJobQueue().getJob(nextJobId)
                if (isNil(nextJob)) {
                    return
                }
                log.info({
                    message: '[workerJobRateLimiter] Promoting next job',
                    jobId: nextJobId,
                })
                await redis.multi()
                    .srem(projectActiveSetKey(projectId), jobId)
                    .zadd(projectActiveSetKey(projectId), nextJobId)
                    .zrem(waitingSetKey, nextJobId)
                    .exec()

                await nextJob.promote()


            },
        })
    },
    async shouldBeLimited(jobId: string | undefined, data: JobData): Promise<{
        shouldRateLimit: boolean
    }> {
        const projectRateLimiterEnabled = workerMachine.getSettings().PROJECT_RATE_LIMITER_ENABLED
        if (isNil(data.projectId) || !projectRateLimiterEnabled || isNil(jobId) || !RATE_LIMIT_WORKER_JOB_TYPES.includes(data.jobType)) {
            return {
                shouldRateLimit: false,
            }
        }
        const castedJob = data as ExecuteFlowJobData
        if (castedJob.environment === RunEnvironment.TESTING) {
            return {
                shouldRateLimit: false,
            }
        }

        const maxConcurrentJobsPerProject = await getMaxConcurrentJobs({
            platformId: data.platformId,
        })
        const setKey = projectActiveSetKey(data.projectId)
        const redis = await workerRedisConnections.useExisting()

        const result = await redis.eval(
            `
                local setKey = KEYS[1]
                local jobId = ARGV[1]
                local maxConcurrent = tonumber(ARGV[2])
                
                -- If the job is already in the set, do not rate limit
                if redis.call('SISMEMBER', setKey, jobId) == 1 then
                    return 0 -- Job is already counted, should not rate limit
                end
                
                local size = redis.call('SCARD', setKey)
                if size >= maxConcurrent then
                    return 1 -- Should rate limit
                end
                
                redis.call('SADD', setKey, jobId)
                return 0 -- Should not rate limit
            `,
            1,
            setKey,
            jobId,
            maxConcurrentJobsPerProject,
        )

        return {
            shouldRateLimit: result === 1,
        }
    },

})

const PLAN_CONCURRENT_JOBS_LIMITS: Record<string, number> = {
    [PlanName.STANDARD]: 5,
    [PlanName.APPSUMO_ACTIVEPIECES_TIER1]: 5,
    [PlanName.APPSUMO_ACTIVEPIECES_TIER2]: 5,
    [PlanName.APPSUMO_ACTIVEPIECES_TIER3]: 10,
    [PlanName.APPSUMO_ACTIVEPIECES_TIER4]: 15,
    [PlanName.APPSUMO_ACTIVEPIECES_TIER5]: 20,
    [PlanName.APPSUMO_ACTIVEPIECES_TIER6]: 25,
    [PlanName.ENTERPRISE]: 30,
}

function getThrottledJobQueue(): Queue<JobData> {
    if (isNil(throttledJobQueue)) {
        throw new Error('Throttled job queue not initialized')
    }
    return throttledJobQueue
}

function concurrentJobsFromPlan({ platformId, storedValues }: GetConcurrentJobsFromPlanParams): number | null {
    if (workerMachine.getSettings().EDITION !== ApEdition.CLOUD) {
        return null
    }

    const planNameKey = getPlatformPlanNameKey(platformId)
    const platformPlanName = storedValues[planNameKey]

    if (isNil(platformPlanName)) {
        return null
    }

    return PLAN_CONCURRENT_JOBS_LIMITS[platformPlanName] ?? null
}

async function getMaxConcurrentJobs({ platformId }: GetMaximumConcurrentJovsPerProjectParams): Promise<number> {
    const storedValues = await workerDistributedStore.getAll<string>([getPlatformPlanNameKey(platformId)])

    const concurrentJobsFromPlanValue = concurrentJobsFromPlan({ platformId, storedValues })
    if (!isNil(concurrentJobsFromPlanValue)) {
        return concurrentJobsFromPlanValue
    }

    return workerMachine.getSettings().MAX_CONCURRENT_JOBS_PER_PROJECT
}

type GetConcurrentJobsFromPlanParams = {
    platformId: PlatformId
    storedValues: Record<string, string | null>
}

type GetMaximumConcurrentJovsPerProjectParams = {
    platformId: PlatformId
}