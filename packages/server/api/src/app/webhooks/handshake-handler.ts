import { EngineResponseStatus, FlowId, FlowVersionId, isNil, ProjectId, TriggerHookType, TriggerPayload, TriggerSource, WebhookHandshakeConfiguration, WebhookHandshakeStrategy, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EngineHelperResponse, EngineHelperTriggerResult } from 'server-worker'
import { projectService } from '../project/project-service'
import { triggerUtils } from '../trigger/trigger-source/trigger-utils'
import { userInteractionWatcher } from '../workers/user-interaction-watcher'

type HandshakeCheckResult = boolean | 'NEEDS_EVALUATION'

export const handshakeHandler = (log: FastifyBaseLogger) => ({
    async handleHandshakeRequest(params: HandleHandshakeRequestParams): Promise<WebhookHandshakeResponse | null> {
        const { payload, handshakeConfiguration } = params

        const staticCheck = isHandshakeRequest({ payload, handshakeConfiguration })
        
        if (staticCheck === false) {
            return null
        }

        const platformId = await projectService.getPlatformId(params.projectId)

        if (staticCheck === 'NEEDS_EVALUATION') {
            const shouldHandshakeResponse = await userInteractionWatcher(log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperTriggerResult<TriggerHookType.SHOULD_HANDSHAKE>>>({
                jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
                hookType: TriggerHookType.SHOULD_HANDSHAKE,
                flowId: params.flowId,
                flowVersionId: params.flowVersionId,
                projectId: params.projectId,
                test: false,
                platformId,
                triggerPayload: payload,
            })
            
            if (shouldHandshakeResponse.status !== EngineResponseStatus.OK) {
                return null
            }

            if (shouldHandshakeResponse.result?.response) {
                return shouldHandshakeResponse.result.response
            }

            if (!shouldHandshakeResponse.result?.shouldHandshake) {
                return null
            }
        }

        const engineHelperResponse = await userInteractionWatcher(log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperTriggerResult<TriggerHookType.HANDSHAKE>>>({
            jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
            hookType: TriggerHookType.HANDSHAKE,
            flowId: params.flowId,
            flowVersionId: params.flowVersionId,
            projectId: params.projectId,
            test: false,
            platformId,
            triggerPayload: payload,
        })

        if (engineHelperResponse.status !== EngineResponseStatus.OK) {
            return null
        }
        return engineHelperResponse.result?.response ?? null
    },
    async getWebhookHandshakeConfiguration(triggerSource: TriggerSource | null): Promise<WebhookHandshakeConfiguration | null> {
        if (isNil(triggerSource) || isNil(triggerSource.pieceName) || isNil(triggerSource.pieceVersion) || isNil(triggerSource.triggerName) || isNil(triggerSource.projectId)) {
            return null
        }
        const pieceTrigger = await triggerUtils(log).getPieceTriggerByName({
            pieceName: triggerSource.pieceName,
            pieceVersion: triggerSource.pieceVersion,
            triggerName: triggerSource.triggerName,
            projectId: triggerSource.projectId,
        })
        if (isNil(pieceTrigger)) {
            return null
        }
        return pieceTrigger?.handshakeConfiguration ?? null
    },
})  


function isHandshakeRequest(params: IsHandshakeRequestParams): HandshakeCheckResult {
    const { payload, handshakeConfiguration } = params

    if (isNil(handshakeConfiguration) || isNil(handshakeConfiguration.strategy)) {
        return false
    }

    const { strategy, paramName } = handshakeConfiguration

    if (strategy === WebhookHandshakeStrategy.CUSTOM) {
        return 'NEEDS_EVALUATION'
    }

    if (isNil(paramName)) {
        return false
    }

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
    flowId: FlowId
    flowVersionId: FlowVersionId
    projectId: ProjectId
    handshakeConfiguration: WebhookHandshakeConfiguration | null
}

type IsHandshakeRequestParams = {
    payload: TriggerPayload
    handshakeConfiguration: WebhookHandshakeConfiguration | null
}