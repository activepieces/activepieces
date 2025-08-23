import { AppSystemProp, ApQueueJob, DelayedJobData, JobData, OneTimeJobData, QueueName, RepeatableJobType, ScheduledJobData, UserInteractionJobData, UserInteractionJobType, WebhookJobData } from '@activepieces/server-shared'
import { ConsumeJobRequest, ConsumeJobResponse, FlowRunStatus, FlowStatus, isNil, WebsocketClientEvent } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'
import { app } from '../../server'
import { machineService } from '../machine/machine-service'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { flowService } from '../../flows/flow/flow.service'
import { jobQueue } from '../queue'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'


export const jobConsumer = (log: FastifyBaseLogger) => {
    return {
        consume: async (jobId: string, queueName: QueueName, jobData: JobData, attempsStarted: number) => {
            const runDeleted = await isRunDeletedForOneTimeJob(jobData, queueName, attempsStarted, log) || await isRunDeletedForDelayedJob(jobData, queueName, log)
            if (runDeleted) {
                return;
            }
            const isStale = await isStaleFlow(jobData, queueName, log)
            if (isStale) {
                await removeScheduledJob(jobData as ScheduledJobData, log)
                return;
            }
            if (queueName === QueueName.ONE_TIME) {
                const { runId } = jobData as OneTimeJobData
                flowRunService(log).updateRunStatusAsync({
                    flowRunId: runId,
                    status: FlowRunStatus.RUNNING,
                })
            }
            let workerId: string | undefined
            try {
                const { projectId, platformId } = await getProjectIdAndPlatformId(queueName, jobData)
                const engineToken = await accessTokenManager.generateEngineToken({
                    jobId,
                    projectId,
                    platformId,
                })

                workerId = await machineService(log).acquire()
                log.info({
                    message: 'Acquired worker id',
                    workerId,
                })
                const lockTimeout = dayjs.duration(jobConsumer(log).getLockDurationInMs(queueName), 'milliseconds').add(1, 'minutes').asMilliseconds()
                const request: ConsumeJobRequest = {
                    jobId,
                    queueName,
                    jobData,
                    attempsStarted,
                    engineToken,
                }
                const response: ConsumeJobResponse[] | undefined = await app!.io.to(workerId).timeout(lockTimeout).emitWithAck(WebsocketClientEvent.CONSUME_JOB_REQUEST, request)
                log.info({
                    message: 'Consume job response',
                    response,
                })
                if (!response?.[0]?.success) {
                    throw new Error(response?.[0]?.message ?? 'Unknown error')
                }
            }
            finally {
                if (workerId) {
                    await machineService(log).release(workerId)
                }
            }
        },
        getLockDurationInMs(queueName: QueueName): number {
            const triggerTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS)
            const flowTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS)
            const agentTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.AGENT_TIMEOUT_SECONDS)
            switch (queueName) {
                case QueueName.WEBHOOK:
                    return dayjs.duration(triggerTimeoutSandbox, 'seconds').asMilliseconds()
                case QueueName.USERS_INTERACTION:
                    return dayjs.duration(flowTimeoutSandbox, 'seconds').asMilliseconds()
                case QueueName.ONE_TIME:
                    return dayjs.duration(flowTimeoutSandbox, 'seconds').asMilliseconds()
                case QueueName.SCHEDULED:
                    return dayjs.duration(triggerTimeoutSandbox, 'seconds').asMilliseconds()
                case QueueName.AGENTS:
                    return dayjs.duration(agentTimeoutSandbox, 'seconds').asMilliseconds()
            }
        },
    }
}


async function getProjectIdAndPlatformId(queueName: QueueName, job: JobData): Promise<{
    projectId: string
    platformId: string
}> {
    switch (queueName) {
        case QueueName.AGENTS:
        case QueueName.ONE_TIME:
        case QueueName.WEBHOOK:
        case QueueName.SCHEDULED: {
            const castedJob = job as OneTimeJobData | WebhookJobData | ScheduledJobData
            return {
                projectId: castedJob.projectId,
                platformId: await projectService.getPlatformId(castedJob.projectId),
            }
        }
        case QueueName.USERS_INTERACTION: {
            const userInteractionJob = job as UserInteractionJobData
            switch (userInteractionJob.jobType) {
                case UserInteractionJobType.EXECUTE_VALIDATION:
                case UserInteractionJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
                    return {
                        projectId: userInteractionJob.projectId!,
                        platformId: userInteractionJob.platformId,
                    }
                default:
                    return {
                        projectId: userInteractionJob.projectId,
                        platformId: await projectService.getPlatformId(userInteractionJob.projectId),
                    }
            }
        }
    }
}

async function isRunDeletedForOneTimeJob(
    job: JobData,
    queueName: QueueName,
    attempsStarted: number,
    log: FastifyBaseLogger,
): Promise<boolean> {
    if (queueName !== QueueName.ONE_TIME) {
        return false
    }

    const skipDeletionCheckForFirstAttemptExecutionSpeed = attempsStarted === 0
    if (skipDeletionCheckForFirstAttemptExecutionSpeed) {
        return false
    }

    const { runId } = job as OneTimeJobData

    const runExists = await flowRunService(log).existsBy(runId)
    return !runExists
}


async function isRunDeletedForDelayedJob(
    job: JobData,
    queueName: QueueName,
    log: FastifyBaseLogger,
): Promise<boolean> {
    if (queueName !== QueueName.SCHEDULED) {
        return false
    }
    const scheduledJob = job as ScheduledJobData | DelayedJobData
    if (scheduledJob.jobType !== RepeatableJobType.DELAYED_FLOW) {
        return false
    }
    const { runId } = scheduledJob

    const runExists = await flowRunService(log).existsBy(runId)
    return !runExists

}

async function isStaleFlow(job: JobData, queueName: QueueName, log: FastifyBaseLogger): Promise<boolean> {
    if (queueName !== QueueName.SCHEDULED) {
        return false
    }
    const scheduledJob = job as ScheduledJobData | DelayedJobData
    const flowVersion = await flowVersionService(log).getOne(scheduledJob.flowVersionId)
    if (isNil(flowVersion)) {
        return true
    }
    const flow = await flowService(log).getOneById(flowVersion.flowId)
    if (isNil(flow)) {
        return true
    }
    return flow.status === FlowStatus.DISABLED || flow?.publishedVersionId !== scheduledJob.flowVersionId
}


async function removeScheduledJob(job: ScheduledJobData, log: FastifyBaseLogger) {
    log.info({
        message: '[WorkerController#removeScheduledJob]',
        flowVersionId: job.flowVersionId,
    }, 'removing stale scheduled job')
    await jobQueue(log).removeRepeatingJob({
        flowVersionId: job.flowVersionId,
    })
    const flowVersion = await flowVersionService(log).getOne(job.flowVersionId)
    if (isNil(flowVersion)) {
        return
    }
    await triggerSourceService(log).disable({
        projectId: job.projectId,
        flowId: flowVersion.flowId,
        simulate: false,
        ignoreError: true,
    })
}