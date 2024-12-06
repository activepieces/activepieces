import { UserInteractionJobData, UserInteractionJobType } from '@activepieces/server-shared'
import { AppConnectionValue } from '@activepieces/shared'
import { workerApiService } from '../api/server-api.service'
import { engineRunner } from '../engine'

async function execute(jobData: UserInteractionJobData, engineToken: string, workerToken: string): Promise<void> {
    let response: unknown
    switch (jobData.jobType) {
        case UserInteractionJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
            response = await engineRunner.extractPieceMetadata(engineToken, jobData.piece)
            break
        case UserInteractionJobType.EXECUTE_VALIDATION:
            response = await engineRunner.executeValidateAuth(engineToken, {
                platformId: jobData.platformId,
                auth: jobData.connectionValue as AppConnectionValue,
                piece: jobData.piece,
            })
            break
        case UserInteractionJobType.EXECUTE_TRIGGER_HOOK:
            response = await engineRunner.executeTrigger(engineToken, {
                hookType: jobData.hookType,
                flowVersion: jobData.flowVersion,
                webhookUrl: jobData.webhookUrl,
                test: jobData.test,
                projectId: jobData.projectId,
            })
            break
        case UserInteractionJobType.EXECUTE_ACTION:
            response =  await engineRunner.executeAction(engineToken, {
                stepName: jobData.stepName,
                flowVersion: jobData.flowVersion,
                sampleData: jobData.sampleData,
                projectId: jobData.projectId,
            })
            break
        case UserInteractionJobType.EXECUTE_PROPERTY:
            response = await engineRunner.executeProp(engineToken, {
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
}
    

export const userInteractionJobExecutor = {
    execute,
}