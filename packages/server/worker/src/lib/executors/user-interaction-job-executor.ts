import { UserInteractionJobData, UserInteractionJobType } from '@activepieces/server-shared'
import { AppConnectionValue } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerApiService } from '../api/server-api.service'
import { engineRunner } from '../runner'
import { workerMachine } from '../utils/machine'
import { webhookUtils } from '../utils/webhook-utils'

export const userInteractionJobExecutor = (log: FastifyBaseLogger) => ({
    async execute(jobData: UserInteractionJobData, engineToken: string, workerToken: string): Promise<void> {
        let response: unknown
        switch (jobData.jobType) {
            case UserInteractionJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
                response = await engineRunner(log).extractPieceMetadata(engineToken, {
                    ...jobData.piece,
                    platformId: jobData.platformId,
                })
                break
            case UserInteractionJobType.EXECUTE_VALIDATION:
                response = await engineRunner(log).executeValidateAuth(engineToken, {
                    platformId: jobData.platformId,
                    auth: jobData.connectionValue as AppConnectionValue,
                    piece: jobData.piece,
                })
                break
            case UserInteractionJobType.EXECUTE_TRIGGER_HOOK:
                response = await engineRunner(log).executeTrigger(engineToken, {
                    hookType: jobData.hookType,
                    flowVersion: jobData.flowVersion,
                    webhookUrl: await webhookUtils(log).getWebhookUrl({
                        flowId: jobData.flowVersion.flowId,
                        simulate: jobData.test,
                        publicApiUrl: workerMachine.getPublicApiUrl(),
                    }),
                    triggerPayload: jobData.triggerPayload,
                    test: jobData.test,
                    projectId: jobData.projectId,
                })
                break
            case UserInteractionJobType.EXECUTE_TOOL:
                response =  await engineRunner(log).excuteTool(engineToken, {
                    actionName: jobData.actionName,
                    pieceName: jobData.pieceName,
                    pieceVersion: jobData.pieceVersion,
                    input: jobData.input,
                    projectId: jobData.projectId,
                })
                break
            case UserInteractionJobType.EXECUTE_PROPERTY:
                response = await engineRunner(log).executeProp(engineToken, {
                    piece: jobData.piece,
                    flowVersion: jobData.flowVersion,
                    propertyName: jobData.propertyName,
                    actionOrTriggerName: jobData.actionOrTriggerName,
                    input: jobData.input,
                    sampleData: jobData.sampleData,
                    projectId: jobData.projectId,
                    searchValue: jobData.searchValue,
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