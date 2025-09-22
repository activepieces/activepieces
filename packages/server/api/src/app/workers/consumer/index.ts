import { AppSystemProp, QueueName } from '@activepieces/server-shared'
import { ConsumeJobRequest, ConsumeJobResponse, ConsumeJobResponseStatus, JobData, WebsocketClientEvent, WorkerJobType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { system } from '../../helper/system/system'
import { app } from '../../server'
import { machineService } from '../machine/machine-service'
import { preHandlers } from './pre-handlers'

export const jobConsumer = (log: FastifyBaseLogger) => {
    return {
        consume: async (jobId: string, queueName: QueueName, jobData: JobData, attempsStarted: number) => {
            const preHandler = preHandlers[jobData.jobType]
            const preHandlerResult = await preHandler.handle(jobData, attempsStarted, log)
            if (preHandlerResult.shouldSkip) {
                log.debug({
                    message: 'Skipping job execution',
                    reason: preHandlerResult.reason,
                    jobId,
                    queueName,
                })
                return
            }
            let workerId: string | undefined
            try {
                const engineToken = await accessTokenManager.generateEngineToken({
                    jobId,
                    projectId: jobData.projectId!,
                    platformId: jobData.platformId,
                })

                workerId = await machineService(log).acquire()
                log.info({
                    message: 'Acquired worker id',
                    workerId,
                })

                const workerTimeoutInMs = jobConsumer(log).getTimeoutForWorkerJob(jobData.jobType)
                const jobTimeout = dayjs.duration(workerTimeoutInMs, 'milliseconds').add(1, 'minutes').asMilliseconds()

                const request: ConsumeJobRequest = {
                    jobId,
                    jobData,
                    attempsStarted,
                    engineToken,
                    timeoutInSeconds: dayjs.duration(workerTimeoutInMs, 'milliseconds').asSeconds(),
                }
                const response: ConsumeJobResponse[] | undefined = await app!.io.to(workerId).timeout(jobTimeout).emitWithAck(WebsocketClientEvent.CONSUME_JOB_REQUEST, request)
                log.info({
                    message: 'Consume job response',
                    response,
                })
                const isInternalError = response?.[0]?.status === ConsumeJobResponseStatus.INTERNAL_ERROR
                if (isInternalError) {
                    throw new Error(response?.[0]?.errorMessage ?? 'Unknown error')
                }
            }
            finally {
                if (workerId) {
                    await machineService(log).release(workerId)
                }
            }
        },
        getTimeoutForWorkerJob(jobType: WorkerJobType): number {
            const triggerTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS)
            const flowTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS)
            const agentTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.AGENT_TIMEOUT_SECONDS)
            const triggerHooksTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.TRIGGER_HOOKS_TIMEOUT_SECONDS)
            switch (jobType) {
                case WorkerJobType.EXECUTE_TRIGGER_HOOK:
                case WorkerJobType.RENEW_WEBHOOK:
                    return dayjs.duration(triggerHooksTimeoutSandbox, 'seconds').asMilliseconds()
                case WorkerJobType.EXECUTE_WEBHOOK:
                case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
                case WorkerJobType.EXECUTE_TOOL:
                case WorkerJobType.EXECUTE_PROPERTY:
                case WorkerJobType.EXECUTE_VALIDATION:
                case WorkerJobType.EXECUTE_POLLING:
                    return dayjs.duration(triggerTimeoutSandbox, 'seconds').asMilliseconds()
                case WorkerJobType.EXECUTE_FLOW:
                    return dayjs.duration(flowTimeoutSandbox, 'seconds').asMilliseconds()
                case WorkerJobType.EXECUTE_AGENT:
                    return dayjs.duration(agentTimeoutSandbox, 'seconds').asMilliseconds()
            }
        },
    }
}
