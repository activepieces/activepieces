import {
    TriggerBase,
    TriggerStrategy,
    WebhookRenewStrategy,
} from '@activepieces/pieces-framework'
import { exceptionHandler, UserInteractionJobType } from '@activepieces/server-shared'
import {
    FlowVersion,
    PieceTrigger,
    ProjectId,
    TriggerHookType,
    TriggerType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EngineHelperResponse, EngineHelperTriggerResult } from 'server-worker'
import { appEventRoutingService } from '../../../app-event-routing/app-event-routing.service'
import { jobQueue } from '../../../workers/queue'
import { userInteractionWatcher } from '../../../workers/user-interaction-watcher'
import { triggerUtils } from './trigger-utils'

export const disablePieceTrigger = async (
    params: DisableParams,
    log: FastifyBaseLogger,
): Promise<EngineHelperResponse<
EngineHelperTriggerResult<TriggerHookType.ON_DISABLE>
> | null> => {
    const { flowVersion, projectId, simulate } = params
    if (flowVersion.trigger.type !== TriggerType.PIECE) {
        return null
    }
    const flowTrigger = flowVersion.trigger as PieceTrigger
    const pieceTrigger = await triggerUtils(log).getPieceTrigger({
        trigger: flowTrigger,
        projectId,
    })

    if (!pieceTrigger) {
        return null
    }

    try {
        const result = await userInteractionWatcher(log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperTriggerResult<TriggerHookType.ON_DISABLE>>>({
            jobType: UserInteractionJobType.EXECUTE_TRIGGER_HOOK,
            hookType: TriggerHookType.ON_DISABLE,
            flowVersion,
            test: simulate,
            projectId,
        })
        return result
    }
    catch (error) {
        if (!params.ignoreError) {
            exceptionHandler.handle(error, log)
            throw error
        }
        return null
    }
    finally {
        await sideeffect(pieceTrigger, projectId, flowVersion, log)
    }
}

async function sideeffect(
    pieceTrigger: TriggerBase,
    projectId: string,
    flowVersion: FlowVersion,
    log: FastifyBaseLogger,
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
                await jobQueue(log).removeRepeatingJob({
                    flowVersionId: flowVersion.id,
                })
            }
            break
        }
        case TriggerStrategy.POLLING:
            await jobQueue(log).removeRepeatingJob({
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
