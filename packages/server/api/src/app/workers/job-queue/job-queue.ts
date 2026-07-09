import { ApId, isNil, unique } from '@activepieces/core-utils'
import { apDayjsDuration, memoryLock } from '@activepieces/server-utils'
import { EventDestinationJobData, ExecuteChatAgentJobData, ExecuteFlowJobData, getDefaultJobPriority, JOB_PRIORITY, JobData, PollingJobData, RenewWebhookJobData, ScheduleOptions, UserInteractionJobData, WebhookJobData, WorkerJobType } from '@activepieces/shared'
import { Job, Queue } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis-connections'
import { workerGroupService } from '../../ee/platform/platform-plan/worker-group.service'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { projectWorkerGroupService } from '../../project/project-worker-group.service'
import { getPlatformGroupQueueName, getProjectGroupQueueName, QueueName } from '../job'
import { workerCapacity } from '../machine/worker-capacity'

const EIGHT_MINUTES_IN_MILLISECONDS = apDayjsDuration(8, 'minute').asMilliseconds()
const REDIS_FAILED_JOB_RETENTION_DAYS = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS), 'day').asSeconds()
const REDIS_FAILED_JOB_RETRY_COUNT = system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT)

const dedicatedWorkersQueues = new Map<string, Queue>()

export const jobQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        await ensureQueueExists({ log, queueName: QueueName.WORKER_JOBS })
        // Materialize on every API replica at boot (not lazily on first sync enqueue) so the queue is
        // present in getAllQueues on all replicas — Bull Board lists it and /queue-metrics reports a
        // deterministic depth (0 when idle) instead of omitting it, which an autoscaler would misread.
        await ensureQueueExists({ log, queueName: QueueName.SYNC_JOBS })
        log.info('[jobQueue#init] Dynamic queue system initialized')
    },
    async add(params: AddJobParams<JobType>): Promise<Job | null> {
        const { type, data } = params

        const platformId = data.platformId
        const projectId = 'projectId' in data ? data.projectId : null
        const syncRun = params.type === JobType.ONE_TIME && params.syncRun === true
        const queueName = await getQueueName({ platformId, projectId, jobType: data.jobType, syncRun }, log)
        const queue = await ensureQueueExists({ log, queueName })

        switch (type) {
            case JobType.REPEATING: {
                await queue.upsertJobScheduler(data.flowVersionId, {
                    pattern: params.scheduleOptions.cronExpression,
                    tz: params.scheduleOptions.timezone,
                }, {
                    name: data.flowVersionId,
                    data,
                    opts: {
                        priority: JOB_PRIORITY[getDefaultJobPriority(data)],
                    },
                })
                return null
            }
            case JobType.ONE_TIME: {
                return queue.add(params.id, data, {
                    priority: JOB_PRIORITY[getDefaultJobPriority(data)],
                    delay: params.delay,
                    jobId: params.id,
                    ...(data.jobType === WorkerJobType.EVENT_DESTINATION ? { removeOnFail: true } : {}),
                    ...(data.jobType === WorkerJobType.EXECUTE_CHAT_AGENT ? { attempts: 1 } : {}),
                    ...isUserInteractionJob(data.jobType) ? {
                        attempts: 1,
                        removeOnComplete: { age: 300 },
                    } : {},
                })
            }
        }
    },

    async removeRepeatingJob({ flowVersionId }: { flowVersionId: ApId }): Promise<void> {
        const allQueues = [...dedicatedWorkersQueues.values()].filter(queue => !isNil(queue))

        await Promise.allSettled(
            allQueues.map(queue => queue.removeJobScheduler(flowVersionId)),
        )

        log.info({
            flowVersion: { id: flowVersionId },
        }, '[jobQueue#removeRepeatingJob] removed jobs from all queues')
    },

    async removeOneTimeJob({ jobId, platformId, projectId, jobType }: RemoveOneTimeJobParams): Promise<void> {
        const queueName = await getQueueName({ platformId, projectId, jobType }, log)
        const queue = await ensureQueueExists({ log, queueName })
        const job = await queue.getJob(jobId)
        if (!isNil(job)) {
            await job.remove()
            log.info({
                job: { id: jobId },
                queueName,
            }, '[jobQueue#removeOneTimeJob] removed job from queue')
            return
        }
        log.info({
            job: { id: jobId },
            queueName,
        }, '[jobQueue#removeOneTimeJob] job not found in queue')
    },

    async getOrCreateQueue({ queueName }: { queueName: string }): Promise<Queue> {
        return ensureQueueExists({ log, queueName })
    },

    getAllQueues(): Queue[] {
        const queues = [...dedicatedWorkersQueues.values()].filter(queue => !isNil(queue))
        return queues
    },

    getSharedQueue(): Queue {
        const queue = dedicatedWorkersQueues.get(QueueName.WORKER_JOBS)
        if (isNil(queue)) {
            throw Error('Shared queue not initialized')
        }
        return queue
    },
    async removeAllFlowRunJobs({ flowRunId, platformId, projectId }: RemoveAllFlowRunJobsParams): Promise<void> {
        // The run's job may sit in the sync queue (routed there while a sync worker was online),
        // and the routed queue is recomputed here, so scan both instead of trusting one answer.
        const routedQueueName = await getQueueName({ platformId, projectId, jobType: WorkerJobType.EXECUTE_FLOW }, log)
        const queueNames = unique([routedQueueName, QueueName.SYNC_JOBS])
        const removedIds: (string | undefined)[] = []
        for (const queueName of queueNames) {
            const queue = await ensureQueueExists({ log, queueName })
            const allJobs = await queue.getJobs(['waiting', 'delayed'])
            const matching = allJobs.filter((j) => j.id?.startsWith(flowRunId))
            await Promise.allSettled(matching.map((j) => j.remove()))
            removedIds.push(...matching.map((j) => j.id))
        }
        log.info({ flowRun: { id: flowRunId }, queueNames, removedIds }, '[jobQueue#removeAllFlowRunJobs] done')
    },

    async close(): Promise<void> {
        log.info('[jobQueue#close] Closing job queue')
        const allQueues = [...dedicatedWorkersQueues.values()].filter(queue => !isNil(queue))
        await Promise.allSettled(
            allQueues.map(queue => queue.close()),
        )
    },
})

async function ensureQueueExists({ log, queueName }: { log: FastifyBaseLogger, queueName: string }): Promise<Queue> {
    const existingQueue = dedicatedWorkersQueues.get(queueName)
    if (!isNil(existingQueue)) {
        return existingQueue
    }
    return memoryLock.runExclusive({
        key: `ensure_queue_exists_${queueName}`,
        fn: async () => {
            const existingQueue = dedicatedWorkersQueues.get(queueName)
            if (!isNil(existingQueue)) {
                return existingQueue
            }

            const queue = new Queue(queueName, {
                connection: await redisConnections.create(),
                defaultJobOptions: {
                    attempts: 2,
                    backoff: {
                        type: 'exponential',
                        delay: EIGHT_MINUTES_IN_MILLISECONDS,
                    },
                    removeOnComplete: true,
                    removeOnFail: {
                        age: REDIS_FAILED_JOB_RETENTION_DAYS,
                        count: REDIS_FAILED_JOB_RETRY_COUNT,
                    },
                },
            })

            await queue.removeGlobalConcurrency()
            await queue.waitUntilReady()

            dedicatedWorkersQueues.set(queueName, queue)

            log.info({
                queueName,
            }, '[jobQueue#ensureQueueExists] Queue created')
            return queue
        },
    })
}

const USER_INTERACTION_JOB_TYPES = new Set([
    WorkerJobType.EXECUTE_PROPERTY,
    WorkerJobType.EXECUTE_VALIDATION,
    WorkerJobType.EXECUTE_TRIGGER_HOOK,
    WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
    WorkerJobType.EXECUTE_TOKEN_REFRESH,
])

export function isUserInteractionJob(jobType: WorkerJobType): boolean {
    return USER_INTERACTION_JOB_TYPES.has(jobType)
}

export function isUserInteractionJobData(jobData: JobData): jobData is UserInteractionJobData {
    return USER_INTERACTION_JOB_TYPES.has(jobData.jobType)
}

const PROJECT_GROUP_ROUTABLE_JOB_TYPES = new Set<WorkerJobType>([
    WorkerJobType.EXECUTE_FLOW,
    WorkerJobType.EXECUTE_WEBHOOK,
])

async function getQueueName({ platformId, projectId, jobType, syncRun }: GetQueueNameParams, log: FastifyBaseLogger): Promise<string> {
    if (!isNil(platformId) && !isNil(projectId) && !isNil(jobType) && PROJECT_GROUP_ROUTABLE_JOB_TYPES.has(jobType)) {
        const workerGroupsEnabled = await workerGroupService(log).isWorkerGroupsEnabled({ platformId })
        if (workerGroupsEnabled) {
            const projectGroupId = await projectWorkerGroupService(log).getProjectWorkerGroup({ projectId, platformId })
            if (!isNil(projectGroupId)) {
                // Only route to the group's dedicated queue while it has a live worker; otherwise fall
                // through to the shared/platform queue so runs still execute until a worker returns.
                const { projectGroups } = await workerCapacity.get()
                const capacity = projectGroups.get(projectGroupId)
                if (!isNil(capacity) && capacity.online > 0) {
                    return getProjectGroupQueueName(projectGroupId)
                }
            }
        }
    }
    if (platformId) {
        const groupId = await workerGroupService(log).getWorkerGroupId({ platformId })
        if (!isNil(groupId)) {
            return getPlatformGroupQueueName(groupId)
        }
    }
    // Same live-capacity gate as project groups: a run whose HTTP caller is actively waiting
    // routes to the dedicated sync queue only while a sync worker is online, so the queue can
    // never become a black hole when the sync pool scales to zero.
    if (syncRun === true) {
        const { sync } = await workerCapacity.get()
        if (sync.online > 0) {
            return QueueName.SYNC_JOBS
        }
    }
    return QueueName.WORKER_JOBS
}


export enum JobType {
    REPEATING = 'repeating',
    ONE_TIME = 'one_time',
}

type GetQueueNameParams = {
    platformId: string | null
    projectId?: string | null
    jobType?: WorkerJobType
    syncRun?: boolean
}

type RemoveOneTimeJobParams = {
    jobId: ApId
    platformId: string | null
    projectId?: string | null
    jobType?: WorkerJobType
}

type RemoveAllFlowRunJobsParams = {
    flowRunId: string
    platformId: string | null
    projectId?: string | null
}

type BaseAddParams<JD extends Omit<JobData, 'engineToken'>, JT extends JobType> = {
    id: ApId
    data: JD
    type: JT
    delay?: number
}
type RepeatingJobAddParams = BaseAddParams<PollingJobData | RenewWebhookJobData, JobType.REPEATING> & {
    scheduleOptions: ScheduleOptions
}
type OneTimeJobAddParams = BaseAddParams<ExecuteFlowJobData | WebhookJobData | UserInteractionJobData | EventDestinationJobData | ExecuteChatAgentJobData, JobType.ONE_TIME> & {
    // Routing hint, not persisted on the job: the enqueuing context attests an HTTP caller is
    // actively awaiting this run's response, making it eligible for the dedicated sync queue.
    syncRun?: boolean
}

export type AddJobParams<type extends JobType> = type extends JobType.REPEATING ? RepeatingJobAddParams : OneTimeJobAddParams
