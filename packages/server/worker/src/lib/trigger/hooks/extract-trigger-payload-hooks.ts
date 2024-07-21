import { logger } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ErrorCode,
    FlowVersion,
    isNil,
    ProjectId,
    TriggerHookType,
    TriggerPayload,
} from '@activepieces/shared'
import { engineApiService } from '../../api/server-api.service'
import { engineRunner } from '../../engine'
import { webhookUtils } from '../../utils/webhook-utils'

export async function extractPayloads(
    engineToken: string,
    params: ExecuteTrigger,
): Promise<unknown[]> {
    const { payload, flowVersion, projectId, simulate } = params
    try {
        const { pieceName, pieceVersion } = flowVersion.trigger.settings
        const { result } = await engineRunner.executeTrigger(engineToken, {
            hookType: TriggerHookType.RUN,
            flowVersion,
            triggerPayload: payload,
            webhookUrl: await webhookUtils.getWebhookUrl({
                flowId: flowVersion.flowId,
                simulate,
            }),
            projectId,
        })
        const isDisabled = await handleFailureFlow(flowVersion, projectId, engineToken)
        if (isDisabled) {
            // TODO disable the trigger
            // return []
        }
        if (!isNil(result) && result.success && Array.isArray(result.output)) {
            const engineController = engineApiService(engineToken)
            await engineController.updateFailureCount({
                flowId: flowVersion.flowId,
                projectId,
                failureCount: 0,
            })
            return result.output as unknown[]
        }
        else {
            logger.error({
                result,
                pieceName,
                pieceVersion,
                flowId: flowVersion.flowId,
            }, 'Failed to execute trigger')
            
            const isDisabled = await handleFailureFlow(flowVersion, projectId, engineToken)
            if (isDisabled) {
                // TODO disable the trigger
            }
            
            return []
        }
    }
    catch (e) {
        const isTimeoutError = e instanceof ActivepiecesError && e.error.code === ErrorCode.EXECUTION_TIMEOUT
        if (isTimeoutError) {
            logger.error({
                name: 'extractPayloads',
                pieceName: params.flowVersion.trigger.settings.pieceName,
                pieceVersion: params.flowVersion.trigger.settings.pieceVersion,
                flowId: flowVersion.flowId,
            }, 'Failed to execute trigger due to timeout')

            const isDisabled = await handleFailureFlow(flowVersion, projectId, engineToken)
            if (isDisabled) {
                // Disable the trigger
            }

            // TODO add error handling which is notify the user and disable the trigger
            return []
        }
        throw e
    }
}

async function handleFailureFlow(flowVersion: FlowVersion, projectId: ProjectId, engineToken: string): Promise<boolean> {
    const engineController = engineApiService(engineToken)

    const failureCount = await engineController.getFailureCount({
        flowId: flowVersion.flowId,
        projectId,
    })

    if (failureCount >= 10) {
        return true
    }

    await engineController.updateFailureCount({
        flowId: flowVersion.flowId,
        projectId,
        failureCount: failureCount + 1,
    })

    return false
}

type ExecuteTrigger = {
    flowVersion: FlowVersion
    projectId: ProjectId
    simulate: boolean
    payload: TriggerPayload
}
