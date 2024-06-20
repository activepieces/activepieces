import { appEventRoutingService } from '../../../app-event-routing/app-event-routing.service'
import { flowQueue } from '../../../flow-worker/queue'
import {
    engineHelper,
} from '../../../helper/engine-helper'
import { webhookService } from '../../../webhooks/webhook-service'
import { triggerUtils } from './trigger-utils'
import {
    TriggerBase,
    TriggerStrategy,
    WebhookRenewStrategy,
} from '@activepieces/pieces-framework'
import { exceptionHandler } from '@activepieces/server-shared'
import {
    FlowVersion,
    PieceTrigger,
    ProjectId,
    TriggerHookType,
    TriggerType,
} from '@activepieces/shared'
import { EngineHelperResponse, EngineHelperTriggerResult } from 'server-worker'

export const disablePieceTrigger = async (
    params: DisableParams,
): Promise<EngineHelperResponse<
EngineHelperTriggerResult<TriggerHookType.ON_DISABLE>
> | null> => {
    const { flowVersion, projectId, simulate } = params
    if (flowVersion.trigger.type !== TriggerType.PIECE) {
        return null
    }
    const flowTrigger = flowVersion.trigger as PieceTrigger
    const pieceTrigger = await triggerUtils.getPieceTrigger({
        trigger: flowTrigger,
        projectId,
    })

    if (!pieceTrigger) {
        return null
    }

    try {
        return await engineHelper.executeTrigger({
            hookType: TriggerHookType.ON_DISABLE,
            flowVersion,
            webhookUrl: await webhookService.getWebhookUrl({
                flowId: flowVersion.flowId,
                simulate,
            }),
            projectId,
        })
    }
    catch (error) {
        exceptionHandler.handle(error)
        if (!params.ignoreError) {
            throw error
        }
        return null
    }
    finally {
        await sideeffect(pieceTrigger, projectId, flowVersion)
    }
}

async function sideeffect(
    pieceTrigger: TriggerBase,
    projectId: string,
    flowVersion: FlowVersion,
): Promise<void> {
    switch (pieceTrigger.type) {
        case TriggerStrategy.APP_WEBHOOK:
            await appEventRoutingService.deleteListeners({
                projectId,
                flowId: flowVersion.flowId,
            })
            break
        case TriggerStrategy.WEBHOOK: {
            const renewConfiguration = pieceTrigger.renewConfiguration
            if (renewConfiguration?.strategy === WebhookRenewStrategy.CRON) {
                await flowQueue.removeRepeatingJob({
                    id: flowVersion.id,
                })
            }
            break
        }
        case TriggerStrategy.POLLING:
            await flowQueue.removeRepeatingJob({
                id: flowVersion.id,
            })
            break
    }
}
type DisableParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    simulate: boolean
    ignoreError?: boolean
}
