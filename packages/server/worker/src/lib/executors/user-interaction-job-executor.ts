import { AppConnectionValue, UserInteractionJobData, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerApiService } from '../api/server-api.service'
import { engineRunner } from '../runner'
import { EngineHelperResponse, EngineHelperResult } from '../runner/engine-runner-types'
import { workerMachine } from '../utils/machine'
import { webhookUtils } from '../utils/webhook-utils'

export const userInteractionJobExecutor = (log: FastifyBaseLogger) => ({
    async execute(jobData: UserInteractionJobData, engineToken: string, workerToken: string, timeoutInSeconds: number): Promise<void> {
        let response: EngineHelperResponse<EngineHelperResult>
        switch (jobData.jobType) {
            case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
                response = await engineRunner(log).extractPieceMetadata(engineToken, {
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
            case WorkerJobType.EXECUTE_TRIGGER_HOOK:
                response = await engineRunner(log).executeTrigger(engineToken, {
                    hookType: jobData.hookType,
                    flowVersion: jobData.flowVersion,
                    webhookUrl: await webhookUtils(log).getWebhookUrl({
                        flowId: jobData.flowVersion.flowId,
                        simulate: jobData.test,
                        publicApiUrl: workerMachine.getPublicApiUrl(),
                    }),
                    triggerPayload: jobData.triggerPayload,
                    projectId: jobData.projectId,
                    test: jobData.test,
                    timeoutInSeconds,
                })
                break
            case WorkerJobType.EXECUTE_TOOL:
                response =  await engineRunner(log).excuteTool(engineToken, {
                    actionName: jobData.actionName,
                    pieceName: jobData.pieceName,
                    pieceVersion: jobData.pieceVersion,
                    input: jobData.input,
                    projectId: jobData.projectId,
                    timeoutInSeconds,
                })
                break
            case WorkerJobType.EXECUTE_PROPERTY:
                response = await engineRunner(log).executeProp(engineToken, {
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
        await workerApiService(workerToken).sendUpdate({
            workerServerId: jobData.webserverId,
            requestId: jobData.requestId,
            response,
        })
    },
})