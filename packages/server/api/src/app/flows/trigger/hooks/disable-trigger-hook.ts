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
import { EngineHelperResponse, EngineHelperTriggerResult, engineRunner, webhookUtils } from 'server-worker'
import { appEventRoutingService } from '../../../app-event-routing/app-event-routing.service'

import { accessTokenManager } from '../../../authentication/lib/access-token-manager'
import { projectService } from '../../../project/project-service'
import { flowQueue } from '../../../workers/queue'
import { triggerUtils } from './trigger-utils'

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
        const platformId = await projectService.getPlatformId(projectId)
        const engineToken = await accessTokenManager.generateEngineToken({
            projectId,
            platformId,
        })
        const result = await engineRunner.executeTrigger(engineToken, {
            hookType: TriggerHookType.ON_DISABLE,
            flowVersion,
            webhookUrl: await webhookUtils.getWebhookUrl({
                flowId: flowVersion.flowId,
                simulate,
            }),
            test: simulate,
            projectId,
        })
        return result
    }
    catch (error) {
        if (!params.ignoreError) {
            exceptionHandler.handle(error)
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
                    flowVersionId: flowVersion.id,
                })
            }
            break
        }
        case TriggerStrategy.POLLING:
            await flowQueue.removeRepeatingJob({
                flowVersionId: flowVersion.id,
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
