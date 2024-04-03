import { engineHelper } from '../../../helper/engine-helper'
import { webhookService } from '../../../webhooks/webhook-service'
import { getPieceTrigger } from './trigger-utils'
import {
    WebhookHandshakeStrategy,
    WebhookResponse,
} from '@activepieces/pieces-framework'
import {
    FlowVersion,
    isNil,
    ProjectId,
    TriggerHookType,
    TriggerPayload,
    TriggerType,
} from '@activepieces/shared'

export async function tryHandshake(
    params: ExecuteHandshakeParams,
): Promise<WebhookResponse | null> {
    const { payload, flowVersion, projectId } = params
    const flowTrigger = flowVersion.trigger
    if (flowTrigger.type === TriggerType.PIECE) {
        const pieceTrigger = await getPieceTrigger({
            trigger: flowTrigger,
            projectId,
        })
        const handshakeConfig = pieceTrigger.handshakeConfiguration
        if (isNil(handshakeConfig)) {
            return null
        }
        const strategy = handshakeConfig.strategy ?? WebhookHandshakeStrategy.NONE
        switch (strategy) {
            case WebhookHandshakeStrategy.HEADER_PRESENT: {
                if (
                    handshakeConfig.paramName &&
          handshakeConfig.paramName.toLowerCase() in payload.headers
                ) {
                    return executeHandshake({
                        flowVersion,
                        projectId,
                        payload,
                    })
                }
                break
            }
            case WebhookHandshakeStrategy.QUERY_PRESENT: {
                if (
                    handshakeConfig.paramName &&
          handshakeConfig.paramName in payload.queryParams
                ) {
                    return executeHandshake({
                        flowVersion,
                        projectId,
                        payload,
                    })
                }
                break
            }
            case WebhookHandshakeStrategy.BODY_PARAM_PRESENT: {
                if (
                    handshakeConfig.paramName &&
          typeof payload.body === 'object' &&
          payload.body !== null &&
          handshakeConfig.paramName in payload.body
                ) {
                    return executeHandshake({
                        flowVersion,
                        projectId,
                        payload,
                    })
                }
                break
            }
            default:
                break
        }
    }
    return null
}

async function executeHandshake(
    params: ExecuteHandshakeParams,
): Promise<WebhookResponse> {
    const { flowVersion, projectId, payload } = params
    const { result } = await engineHelper.executeTrigger({
        hookType: TriggerHookType.HANDSHAKE,
        flowVersion,
        triggerPayload: payload,
        webhookUrl: await webhookService.getWebhookUrl({
            flowId: flowVersion.flowId,
            simulate: false,
        }),
        projectId,
    })
    if (!result.success || result.response === undefined) {
        return {
            status: 500,
            body: {
                error: 'Failed to execute handshake',
            },
        }
    }
    return result.response
}

type ExecuteHandshakeParams = {
    flowVersion: FlowVersion
    projectId: ProjectId
    payload: TriggerPayload
}
