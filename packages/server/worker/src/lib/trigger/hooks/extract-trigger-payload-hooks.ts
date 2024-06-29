import { logger } from '@activepieces/server-shared'
import {
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

type ExecuteTrigger = {
    flowVersion: FlowVersion
    projectId: ProjectId
    simulate: boolean
    payload: TriggerPayload
}
