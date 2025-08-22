import { AppSystemProp, JobData, OneTimeJobData, QueueName, ScheduledJobData, UserInteractionJobData, UserInteractionJobType, WebhookJobData } from '@activepieces/server-shared'
import { ConsumeJobRequest, ConsumeJobResponse, WebsocketClientEvent } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'
import { app } from '../../server'
import { machineService } from '../machine/machine-service'


export const jobConsumer = (log: FastifyBaseLogger) => {
    return {
        consume: async (jobId: string, queueName: QueueName, jobData: JobData, attempsStarted: number) => {
            const { projectId, platformId } = await getProjectIdAndPlatformId(queueName, jobData)
            const engineToken = await accessTokenManager.generateEngineToken({
                jobId,
                projectId,
                platformId,
            })

            const workerId = await machineService(log).acquire()
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
