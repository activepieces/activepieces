import { UserInteractionJobType } from '@activepieces/server-shared'
import { EngineResponseStatus, FlowId, FlowVersion, FlowVersionId, isNil, ProjectId, TriggerHookType, TriggerPayload, WebhookHandshakeConfiguration, WebhookHandshakeStrategy } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EngineHelperResponse, EngineHelperTriggerResult } from 'server-worker'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { triggerUtils } from '../trigger/trigger-source/trigger-utils'
import { userInteractionWatcher } from '../workers/user-interaction-watcher'

export const handshakeHandler = {
    async handleHandshakeRequest(params: HandleHandshakeRequestParams): Promise<WebhookHandshakeResponse | null> {
        const { payload, handshakeConfiguration } = params

        if (!isHandshakeRequest({ payload, handshakeConfiguration })) {
            return null
        }

        const flowVersion = await flowVersionService(params.log).getFlowVersionOrThrow({
            flowId: params.flowId,
            versionId: params.flowVersionId,
        })

        const engineHelperResponse = await userInteractionWatcher(params.log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperTriggerResult<TriggerHookType.HANDSHAKE>>>({
            jobType: UserInteractionJobType.EXECUTE_TRIGGER_HOOK,
            hookType: TriggerHookType.HANDSHAKE,
            flowVersion,
            projectId: params.projectId,
            test: false,
            triggerPayload: payload,
        })

        if (engineHelperResponse.status !== EngineResponseStatus.OK) {
            return null
        }
        return engineHelperResponse.result?.response ?? null
    },
    async getWebhookHandshakeConfiguration(flowVersion: FlowVersion, projectId: ProjectId, log: FastifyBaseLogger): Promise<WebhookHandshakeConfiguration | null> { 
        const pieceTrigger = await triggerUtils(log).getPieceTrigger({
            flowVersion,
            projectId,
        })
        return pieceTrigger?.handshakeConfiguration ?? null
    },
}


function isHandshakeRequest(params: IsHandshakeRequestParams): boolean {
    const { payload, handshakeConfiguration } = params

    if (isNil(handshakeConfiguration) || isNil(handshakeConfiguration.strategy) || isNil(handshakeConfiguration.paramName)) {
        return false
    }

    const { strategy, paramName } = handshakeConfiguration

    switch (strategy) {
        case WebhookHandshakeStrategy.HEADER_PRESENT:
            return paramName.toLowerCase() in payload.headers

        case WebhookHandshakeStrategy.QUERY_PRESENT:
            return paramName in payload.queryParams

        case WebhookHandshakeStrategy.BODY_PARAM_PRESENT:
            return typeof payload.body === 'object' &&
                payload.body !== null &&
                paramName in payload.body

        default:
            return false
    }
}

type WebhookHandshakeResponse = {
    status: number
    body?: unknown
    headers?: Record<string, string>
}

type HandleHandshakeRequestParams = {
    payload: TriggerPayload
    log: FastifyBaseLogger
    flowId: FlowId
    flowVersionId: FlowVersionId
    projectId: ProjectId
    handshakeConfiguration: WebhookHandshakeConfiguration | null
}

type IsHandshakeRequestParams = {
    payload: TriggerPayload
    handshakeConfiguration: WebhookHandshakeConfiguration | null
}