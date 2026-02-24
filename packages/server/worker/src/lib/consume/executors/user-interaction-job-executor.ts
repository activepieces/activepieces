import { AppConnectionValue, assertNotNullOrUndefined, UserInteractionJobData, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowWorkerCache } from '../../cache/flow-worker-cache'
import { engineRunner } from '../../compute'
import { EngineHelperResponse, EngineHelperResult } from '../../compute/engine-runner-types'
import { engineSocketHandlers } from '../../compute/process/engine-socket-handlers'
import { workerMachine } from '../../utils/machine'
import { webhookUtils } from '../../utils/webhook-utils'

export const userInteractionJobExecutor = (log: FastifyBaseLogger) => ({
    async execute(jobData: UserInteractionJobData, engineToken: string, timeoutInSeconds: number): Promise<void> {
        let response: EngineHelperResponse<EngineHelperResult>
        switch (jobData.jobType) {
            case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
                response = await engineRunner(log).extractPieceMetadata({
                    ...jobData.piece,
                    platformId: jobData.platformId,
                    timeoutInSeconds,
                })
                break
            case WorkerJobType.EXECUTE_VALIDATION:
                response = await engineRunner(log).executeValidateAuth(engineToken, {
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
                response = await engineRunner(log).executeTrigger(engineToken, {
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
                response = await engineRunner(log).executeProp(engineToken, {
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
        await engineSocketHandlers(log).sendUserInteractionResponse({
            requestId: jobData.requestId,
            workerServerId: jobData.webserverId,
            response,
        })
    },
})