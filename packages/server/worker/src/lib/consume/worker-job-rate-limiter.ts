import { apDayjsDuration, getPlatformPlanNameKey } from '@activepieces/server-shared'
import {
    ApEdition,
    assertNotNullOrUndefined,
    ExecuteFlowJobData,
    isNil,
    JobData,
    PlanName,
    PlatformId,
    ProjectId,
    RunEnvironment,
    WorkerJobType
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../utils/machine'
import { workerDistributedStore, workerRedisConnections } from '../utils/worker-redis'
import { jobQueue } from '../../../../api/src/app/workers/queue/job-queue';
import { JobType } from '../../../../api/src/app/workers/queue/queue-manager';
import { throttledJobQueue } from '../../../../api/src/app/workers/queue/throttled-job-queue';
import cron from 'node-cron';


export const RATE_LIMIT_WORKER_JOB_TYPES = [WorkerJobType.EXECUTE_FLOW]
const projectActiveSetKey = (projectId: string): string => `active_jobs_set_2:${projectId}`
const projectWaitingSetKey = (projectId: string): string => `waiting_jobs_set:${projectId}`
const PRE_REQUEUE_JOBS_SET_KEY = `pre_requeue_jobs_set`

export const workerJobRateLimiter = (_log: FastifyBaseLogger) => ({
    setup(): void {
        // every 60s
        cron.schedule('*/1 * * * *', async () => {
            _log.info('[workerJobRateLimiter] Running scheduled task to requeue stalled waiting jobs if exists')

            const redis = await workerRedisConnections.useExisting()

            const now = Date.now()
            const VISIBILITY_TIMEOUT_MS = 1 * 60 * 1000; // 1 minutes

            const stalledJobs = await redis.zrangebyscore(
                PRE_REQUEUE_JOBS_SET_KEY,
                '-inf',
                now - VISIBILITY_TIMEOUT_MS
            )
            if (stalledJobs.length === 0) {
                _log.info('[workerJobRateLimiter] No stalled pre-requeue jobs found')
                return
            }

            const byProject = stalledJobs.reduce((map, entry) => {
                const [projectId, jobId] = entry.split(':')
                if (!map.has(projectId)) {
                    map.set(projectId, [])
                }
                map.get(projectId)!.push(jobId)
                return map
            }, new Map<string, string[]>())

            for (const [projectId, jobIds] of byProject) {
                if (jobIds.length === 0) continue

                await redis
                    .multi()
                    .zadd(projectWaitingSetKey(projectId), ...jobIds.flatMap(id => [now, id]))
                    .zrem(PRE_REQUEUE_JOBS_SET_KEY, ...stalledJobs.filter(entry => entry.startsWith(`${projectId}:`)))
                    .exec()

                this.requeueNextWaitingJobIfExists(projectId).catch(err =>
                    _log.error(`[workerJobRateLimiter] Failed to requeue for project ${projectId}`, err)
                )
            }

            _log.info(`[workerJobRateLimiter] Recovered ${stalledJobs.length} stalled jobs across ${byProject.size} projects`)
        })
    },

    async throttleJob(id: string, data: JobData): Promise<void> {
        const redis = await workerRedisConnections.useExisting()

        await redis.zadd(projectWaitingSetKey(data.projectId!), Date.now(), id)

        await throttledJobQueue(_log).add({ id, data })
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

        await redis.srem(projectActiveSetKey(castedJob.projectId), jobId)

        await this.requeueNextWaitingJobIfExists(castedJob.projectId)
    },

    async requeueNextWaitingJobIfExists(projectId: string): Promise<void> {
        const redis = await workerRedisConnections.useExisting()

        const nextJobId = await redis.eval(
            `
              local job = redis.call('ZPOPMIN', KEYS[1])  -- per-project waiting set
              if not job or #job == 0 then
                return nil
              end
            
              local jobId = job[1]
              local now = tonumber(ARGV[1])
              local projectId = ARGV[2]
            
              -- Add to pre-requeue set: member = "projectId:jobId", score = now
              redis.call('ZADD', KEYS[2], now, projectId .. ':' .. jobId)
            
              return jobId
            `,
            2,
            projectWaitingSetKey(projectId),    // KEYS[1]
            PRE_REQUEUE_JOBS_SET_KEY,           // KEYS[2]
            Date.now().toString(),              // ARGV[1]
            projectId                           // ARGV[2]
        );

        if (isNil(nextJobId)) {
            return;
        }

        const nextJob = await throttledJobQueue(_log).getJobById(nextJobId as string)
        assertNotNullOrUndefined(nextJob, 'nextJob')

        await jobQueue(_log).add({
            data: nextJob.data as ExecuteFlowJobData,
            type: JobType.ONE_TIME,
            id: nextJobId as string,
        })

        await redis.zrem(PRE_REQUEUE_JOBS_SET_KEY, `${projectId}:${nextJobId}`)
    },

    async shouldBeLimited(jobId: string | undefined, data: JobData): Promise<{
        shouldRateLimit: boolean
    }> {
        const projectRateLimiterEnabled = workerMachine.getSettings().PROJECT_RATE_LIMITER_ENABLED
        const flowTimeoutInMilliseconds = apDayjsDuration(workerMachine.getSettings().FLOW_TIMEOUT_SECONDS, 'seconds').add(1, 'minute').asMilliseconds()
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

        const maxConcurrentJobsPerProject = await getMaxConcurrentJobsPerProject({
            projectId: data.projectId,
            platformId: data.platformId,
        })
        const setKey = projectActiveSetKey(data.projectId)
        const redis = await workerRedisConnections.useExisting()

        const result = await redis.eval(
            `
                local setKey = KEYS[1]
                local jobId = ARGV[1]
                local maxConcurrent = tonumber(ARGV[2])
                
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
            maxConcurrentJobsPerProject
        );

        return {
            shouldRateLimit: result === 1
        };
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

async function getMaxConcurrentJobsPerProject({ projectId, platformId }: GetMaximumConcurrentJovsPerProjectParams): Promise<number> {
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
    projectId: ProjectId | undefined
}