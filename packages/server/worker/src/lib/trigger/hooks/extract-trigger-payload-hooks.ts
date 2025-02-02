import { rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ErrorCode,
    FlowVersion,
    isNil,
    ProjectId,
    TriggerHookType,
    TriggerPayload,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineApiService } from '../../api/server-api.service'
import { engineRunner } from '../../engine'
import { workerMachine } from '../../utils/machine'
import { webhookUtils } from '../../utils/webhook-utils'

export async function extractPayloads(
    engineToken: string,
    log: FastifyBaseLogger,
    params: ExecuteTrigger,
): Promise<unknown[]> {
    const { payload, flowVersion, projectId, simulate } = params
    try {
        const { pieceName, pieceVersion } = flowVersion.trigger.settings
        const { result } = await engineRunner(log).executeTrigger(engineToken, {
            hookType: TriggerHookType.RUN,
            flowVersion,
            triggerPayload: payload,
            webhookUrl: await webhookUtils(log).getWebhookUrl({
                flowId: flowVersion.flowId,
                simulate,
                publicApiUrl: workerMachine.getPublicApiUrl(),
            }),
            projectId,
            test: simulate,
        })
        if (!isNil(result) && result.success && Array.isArray(result.output)) {
            handleFailureFlow(flowVersion, projectId, engineToken, true, log)
            return result.output as unknown[]
        }
        else {
            log.error({
                result,
                pieceName,
                pieceVersion,
                flowId: flowVersion.flowId,
            }, 'Failed to execute trigger')
            handleFailureFlow(flowVersion, projectId, engineToken, false, log)
            
            return []
        }
    }
    catch (e) {
        const isTimeoutError = e instanceof ActivepiecesError && e.error.code === ErrorCode.EXECUTION_TIMEOUT
        if (isTimeoutError) {
            log.error({
                name: 'extractPayloads',
                pieceName: flowVersion.trigger.settings.pieceName,
                pieceVersion: flowVersion.trigger.settings.pieceVersion,
                flowId: flowVersion.flowId,
            }, 'Failed to execute trigger due to timeout')
            handleFailureFlow(flowVersion, projectId, engineToken, false, log)
            return []
        }
        throw e
    }
}


function handleFailureFlow(flowVersion: FlowVersion, projectId: ProjectId, engineToken: string, success: boolean, log: FastifyBaseLogger): void {
    const engineController = engineApiService(engineToken, log)

    rejectedPromiseHandler(engineController.updateFailureCount({
        flowId: flowVersion.flowId,
        projectId,
        success,
    }), log)

}

type ExecuteTrigger = {
    flowVersion: FlowVersion
    projectId: ProjectId
    simulate: boolean
    payload: TriggerPayload
}
