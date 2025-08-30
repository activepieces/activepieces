import { rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ErrorCode,
    FlowTriggerType,
    FlowVersion,
    isNil,
    ProjectId,
    TriggerHookType,
    TriggerPayload,
    TriggerRunStatus,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineApiService } from '../api/server-api.service'
import { engineRunner } from '../runner'
import { workerMachine } from './machine'
import { webhookUtils } from './webhook-utils'
import { inspect } from 'util'

export const triggerHooks = (log: FastifyBaseLogger) => ({
    renewWebhook: async (params: RenewParams): Promise<void> => {
        const { flowVersion, projectId, simulate } = params
        await engineRunner(log).executeTrigger(params.engineToken, {
            hookType: TriggerHookType.RENEW,
            flowVersion,
            webhookUrl: await webhookUtils(log).getWebhookUrl({
                flowId: flowVersion.flowId,
                simulate,
                publicApiUrl: workerMachine.getPublicApiUrl(),
            }),
            test: simulate,
            projectId,
        })
    },
    extractPayloads: async (
        engineToken: string,
        params: ExecuteTrigger,
    ): Promise<unknown[]> => {
        const { payload, flowVersion, simulate, jobId } = params
        if (flowVersion.trigger.type === FlowTriggerType.EMPTY) {
            log.warn({
                flowVersionId: flowVersion.id,
            }, '[WebhookUtils#extractPayload] empty trigger, skipping')
            return []
        }
        const { payloads, status, error } = await getTriggerPayloadsAndStatus(engineToken, log, params)
        rejectedPromiseHandler(engineApiService(engineToken).createTriggerRun({
            status,
            payload,
            flowId: flowVersion.flowId,
            simulate,
            jobId,
            error: inspect(error),
        }), log)

        return payloads
    },
}) 


type ExtractPayloadsResult = {
    payloads: unknown[]
    status: TriggerRunStatus
    error?: unknown
}

type ExecuteTrigger = {
    flowVersion: FlowVersion
    jobId: string
    projectId: ProjectId
    simulate: boolean
    payload: TriggerPayload
}

type RenewParams = {
    engineToken: string
    flowVersion: FlowVersion
    projectId: ProjectId
    simulate: boolean
}

async function getTriggerPayloadsAndStatus(
    engineToken: string,
    log: FastifyBaseLogger,
    params: ExecuteTrigger,
): Promise<ExtractPayloadsResult> {
    const { payload, flowVersion, projectId, simulate } = params
    try {
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

        if (result.success && Array.isArray(result.output)) {
            return {
                payloads: result.output as unknown[],
                status: TriggerRunStatus.COMPLETED,
            }
        }
        else {
            return {
                payloads: [],
                status: TriggerRunStatus.INTERNAL_ERROR,
                error: result.message,
            }
        }
    }
    catch (e) {
        const isTimeoutError = e instanceof ActivepiecesError && e.error.code === ErrorCode.EXECUTION_TIMEOUT
        if (isTimeoutError) {
            return {
                payloads: [],
                status: TriggerRunStatus.TIMED_OUT,
                error: inspect(e),
            }
        }
        return {
            payloads: [],
            status: TriggerRunStatus.INTERNAL_ERROR,
            error: inspect(e),
        }
    }
}
