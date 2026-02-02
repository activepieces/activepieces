import { AppConnectionValue, assertNotNullOrUndefined, UserInteractionJobData, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowWorkerCache } from '../../cache/flow-worker-cache'
import { operationHandler, OperationResponse, OperationResult } from '../../compute/operation-handler'
import { sandboxSockerHandler } from '../../compute/sandbox-socket-handlers'
import { workerMachine } from '../../utils/machine'
import { webhookUtils } from '../../utils/webhook-utils'

export const userInteractionJobExecutor = (log: FastifyBaseLogger) => ({
    async execute(jobData: UserInteractionJobData, engineToken: string, timeoutInSeconds: number): Promise<void> {
        let response: OperationResponse<OperationResult>
        switch (jobData.jobType) {
            case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
                response = await operationHandler(log).extractPieceMetadata({
                    ...jobData.piece,
                    platformId: jobData.platformId,
                    timeoutInSeconds,
                })
                break
            case WorkerJobType.EXECUTE_VALIDATION:
                response = await operationHandler(log).executeValidateAuth(engineToken, {
                    platformId: jobData.platformId,
                    auth: jobData.connectionValue as AppConnectionValue,
                    piece: jobData.piece,
                    timeoutInSeconds,
                })
                break
            case WorkerJobType.EXECUTE_TRIGGER_HOOK: {
                const flowVersion = await flowWorkerCache(log).getVersion({
                    engineToken,
                    flowVersionId: jobData.flowVersionId,
                })
                assertNotNullOrUndefined(flowVersion, 'flowVersion')
                response = await operationHandler(log).executeTrigger(engineToken, {
                    platformId: jobData.platformId,
                    hookType: jobData.hookType,
                    flowVersion,
                    webhookUrl: await webhookUtils(log).getWebhookUrl({
                        flowId: flowVersion.flowId,
                        simulate: jobData.test,
                        publicApiUrl: workerMachine.getPublicApiUrl(),
                    }),
                    triggerPayload: jobData.triggerPayload,
                    projectId: jobData.projectId,
                    test: jobData.test,
                    timeoutInSeconds,
                })
                break
            }
            case WorkerJobType.EXECUTE_PROPERTY:
                response = await operationHandler(log).executeProp(engineToken, {
                    platformId: jobData.platformId,
                    piece: jobData.piece,
                    flowVersion: jobData.flowVersion,
                    propertyName: jobData.propertyName,
                    actionOrTriggerName: jobData.actionOrTriggerName,
                    input: jobData.input,
                    sampleData: jobData.sampleData,
                    projectId: jobData.projectId,
                    searchValue: jobData.searchValue,
                    timeoutInSeconds,
                })
                break
        }
        await sandboxSockerHandler(log).sendUserInteractionResponse({
            requestId: jobData.requestId,
            workerServerId: jobData.webserverId,
            response,
        })
    },
})