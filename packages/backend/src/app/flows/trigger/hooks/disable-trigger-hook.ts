import { FlowVersion, PieceTrigger, ProjectId, TriggerHookType, TriggerType } from '@activepieces/shared'
import { EngineHelperResponse, EngineHelperTriggerResult, engineHelper } from '../../../helper/engine-helper'
import { getPieceTrigger } from './trigger-utils'
import { webhookService } from '../../../webhooks/webhook-service'
import { TriggerStrategy } from '@activepieces/pieces-framework'
import { appEventRoutingService } from '../../../app-event-routing/app-event-routing.service'
import { flowQueue } from '../../../workers/flow-worker/flow-queue'

export const disablePieceTrigger = async (params: DisableParams): Promise<EngineHelperResponse<
EngineHelperTriggerResult<TriggerHookType.ON_DISABLE>
> | null> => {
    const { flowVersion, projectId, simulate } = params
    if (flowVersion.trigger.type !== TriggerType.PIECE) {
        return null
    }
    const flowTrigger = flowVersion.trigger as PieceTrigger
    const pieceTrigger = await getPieceTrigger({
        trigger: flowTrigger,
        projectId,
    })

    const engineHelperResponse = await engineHelper.executeTrigger({
        hookType: TriggerHookType.ON_DISABLE,
        flowVersion,
        webhookUrl: await webhookService.getWebhookUrl({
            flowId: flowVersion.flowId,
            simulate,
        }),
        projectId,
    })

    switch (pieceTrigger.type) {
        case TriggerStrategy.APP_WEBHOOK:
            await appEventRoutingService.deleteListeners({
                projectId,
                flowId: flowVersion.flowId,
            })
            break
        case TriggerStrategy.WEBHOOK:
            break
        case TriggerStrategy.POLLING:
            await flowQueue.removeRepeatingJob({
                id: flowVersion.id,
            })
            break
    }

    return engineHelperResponse
}
type DisableParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    simulate: boolean
}