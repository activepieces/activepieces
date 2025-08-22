import { JobData, OneTimeJobData, QueueName, ScheduledJobData, UserInteractionJobData, UserInteractionJobType, WebhookJobData } from "@activepieces/server-shared"
import { FastifyBaseLogger } from "fastify"
import { projectService } from "../../project/project-service"
import { accessTokenManager } from "../../authentication/lib/access-token-manager"
import { machineService } from "../machine/machine-service"
import { flowWorker } from "server-worker"


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
                message: 'Sending consume job request to worker',
                jobId,
                queueName,
                workerId,
            })
            await flowWorker(log).consumeJob({
                jobId,
                queueName,
                jobData: jobData,
                attempsStarted,
                engineToken,
            }, (data) => {
                log.info({
                    message: 'Received ack from the worker',
                    jobId,
                    queueName,
                    workerId,
                })
            })
        }
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
