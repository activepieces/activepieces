import { inspect } from 'util'
import { rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ErrorCode,
    FlowTriggerType,
    FlowVersion,
    ProjectId,
    TriggerHookType,
    TriggerPayload,
    TriggerRunStatus,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineApiService } from '../api/server-api.service'
import { engineRunner } from '../compute'
import { workerMachine } from './machine'
import { webhookUtils } from './webhook-utils'

export const triggerHooks = (log: FastifyBaseLogger) => ({
    extractPayloads: async (
        engineToken: string,
        params: ExecuteTrigger,
    ): Promise<ExtractPayloadsResult> => {
        const { payload, flowVersion, simulate, jobId } = params
        if (flowVersion.trigger.type === FlowTriggerType.EMPTY) {
            log.warn({
                flowVersionId: flowVersion.id,
            }, '[WebhookUtils#extractPayload] empty trigger, skipping')
            return {
                status: TriggerRunStatus.COMPLETED,
                payloads: [],
            }
        }
        const { payloads, status, errorMessage } = await getTriggerPayloadsAndStatus(engineToken, log, params)
        rejectedPromiseHandler(engineApiService(engineToken).createTriggerRun({
            status,
            payload,
            flowId: flowVersion.flowId,
            simulate,
            jobId,
            error: errorMessage,
        }), log)

        return {
            status,
            payloads,
            errorMessage,
        }
    },
})


type ExtractPayloadsResult = {
    payloads: unknown[]
    status: TriggerRunStatus
    errorMessage?: string
}

type ExecuteTrigger = {
    flowVersion: FlowVersion
    jobId: string
    projectId: ProjectId
    simulate: boolean
    payload: TriggerPayload
    timeoutInSeconds: number
}

async function getTriggerPayloadsAndStatus(
    engineToken: string,
    log: FastifyBaseLogger,
    params: ExecuteTrigger,
): Promise<ExtractPayloadsResult> {
    const { payload, flowVersion, projectId, simulate, timeoutInSeconds } = params
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
            timeoutInSeconds,
        })

        if (result.success) {
            return {
                payloads: result.output as unknown[],
                status: TriggerRunStatus.COMPLETED,
            }
        }
        else {
            return {
                payloads: [],
                status: TriggerRunStatus.FAILED,
                errorMessage: result.message,
            }
        }
    }
    catch (e) {
        const isTimeoutError = e instanceof ActivepiecesError && e.error.code === ErrorCode.EXECUTION_TIMEOUT
        if (isTimeoutError) {
            return {
                payloads: [],
                status: TriggerRunStatus.TIMED_OUT,
                errorMessage: inspect(e),
            }
        }
        return {
            payloads: [],
            status: TriggerRunStatus.INTERNAL_ERROR,
            errorMessage: inspect(e),
        }
    }
}
