import { engineHelper } from '../../../helper/engine-helper'
import { webhookService } from '../../../webhooks/webhook-service'
import { getPieceTrigger } from './trigger-utils'
import { logger } from '@activepieces/server-shared'
import {
    FlowVersion,
    isNil,
    ProjectId,
    TriggerHookType,
    TriggerPayload,
    TriggerType,
} from '@activepieces/shared'

export async function executeTrigger(
    params: ExecuteTrigger,
): Promise<unknown[]> {
    const { payload, flowVersion, projectId, simulate } = params
    const flowTrigger = flowVersion.trigger
    let payloads: unknown[] = []
    switch (flowTrigger.type) {
        case TriggerType.PIECE: {
            const pieceTrigger = await getPieceTrigger({
                trigger: flowTrigger,
                projectId,
            })
            const { result } = await engineHelper.executeTrigger({
                hookType: TriggerHookType.RUN,
                flowVersion,
                triggerPayload: payload,
                webhookUrl: await webhookService.getWebhookUrl({
                    flowId: flowVersion.flowId,
                    simulate,
                }),
                projectId,
            })

            if (!isNil(result) && result.success && Array.isArray(result.output)) {
                payloads = result.output
            }
            else {
                logger.error(
                    `Flow ${flowTrigger.name} with ${pieceTrigger.name} trigger throws and error, returning as zero payload ` +
            JSON.stringify(result),
                )
                payloads = []
            }

            break
        }
        default:
            payloads = [payload]
            break
    }
    return payloads as unknown[]
}

type ExecuteTrigger = {
    flowVersion: FlowVersion
    projectId: ProjectId
    simulate: boolean
    payload: TriggerPayload
}
