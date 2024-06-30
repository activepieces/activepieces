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
import { engineRunner } from '../../engine'
import { webhookUtils } from '../../utils/webhook-utils'

export async function extractPayloads(
    engineToken: string,
    params: ExecuteTrigger,
): Promise<unknown[]> {
    const { payload, flowVersion, projectId, simulate } = params
    try {
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
        if (!isNil(result) && result.success && Array.isArray(result.output)) {
            return result.output as unknown[]
        }
        else {
            logger.error({
                result,
                pieceName: params.flowVersion.trigger.settings.pieceName,
                pieceVersion: params.flowVersion.trigger.settings.pieceVersion,
                flowId: flowVersion.flowId,
            }, 'Failed to execute trigger')
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
            // TODO add error handling which is notify the user and disable the trigger
            return []
        }
        throw e
    }
}

type ExecuteTrigger = {
    flowVersion: FlowVersion
    projectId: ProjectId
    simulate: boolean
    payload: TriggerPayload
}
