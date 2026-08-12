import { isNil } from '@activepieces/core-utils'
import { BarrierCreatedState, CreateWaitpointRequest, CreateWaitpointResponse, MAX_INLINE_BARRIER_SIGNALS, PauseType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { domainHelper } from '../helper/domain-helper'
import { barrierService, CreateBarrierResult } from './barrier-service'
import { waitpointService } from './waitpoint-service'
import { WaitpointSignal } from './waitpoint-types'

export const waitpointController: FastifyPluginAsyncZod = async (app) => {
    app.post('/', CreateWaitpointParams, async (request, reply) => {
        const { flowRunId, projectId, stepName, type, version, resumeDateTime, responseToSend, workerHandlerId, httpRequestId, barrier } = request.body

        if (type === PauseType.BARRIER) {
            const created = await barrierService(request.log).create({
                flowRunId,
                projectId,
                stepName,
                version,
                responseToSend: responseToSend ?? undefined,
                workerHandlerId: workerHandlerId ?? undefined,
                httpRequestId: httpRequestId ?? undefined,
                policy: barrier?.policy,
                signalLabels: barrier?.signals?.map((signal) => signal.label ?? null),
                fanOut: barrier?.fanOut,
            })
            return reply.status(StatusCodes.CREATED).send({
                id: created.barrier.id,
                resumeUrl: await buildResumeUrl({ flowRunId, waitpointId: created.barrier.id }),
                barrier: await buildBarrierState({ flowRunId, created }),
            })
        }

        const { waitpoint } = await waitpointService(request.log).createForPause({
            flowRunId,
            projectId,
            stepName,
            type,
            version,
            resumeDateTime,
            responseToSend: responseToSend ?? undefined,
            workerHandlerId: workerHandlerId ?? undefined,
            httpRequestId: httpRequestId ?? undefined,
        })
        return reply.status(StatusCodes.CREATED).send({
            id: waitpoint.id,
            resumeUrl: await buildResumeUrl({ flowRunId, waitpointId: waitpoint.id }),
        })
    })
}

async function buildResumeUrl({ flowRunId, waitpointId }: { flowRunId: string, waitpointId: string }): Promise<string> {
    return domainHelper.getPublicApiUrl({ path: `v1/flow-runs/${flowRunId}/waitpoints/${waitpointId}` })
}

async function buildBarrierState({ flowRunId, created }: BuildBarrierStateParams): Promise<BarrierCreatedState> {
    const inlineable = created.signals.length > 0 && created.signals.length <= MAX_INLINE_BARRIER_SIGNALS && created.signals.every((signal) => isNil(signal.sequence))
    return {
        signalCount: created.signalCount,
        batchSize: created.batchSize,
        ...(inlineable ? { signals: await Promise.all(created.signals.map((signal) => toSignalLink({ flowRunId, signal }))) } : {}),
    }
}

async function toSignalLink({ flowRunId, signal }: { flowRunId: string, signal: WaitpointSignal }): Promise<{ label: string | null, confirmUrl: string }> {
    return {
        label: signal.label,
        confirmUrl: await domainHelper.getPublicApiUrl({ path: `v1/flow-runs/${flowRunId}/signals/${signal.id}/confirm` }),
    }
}

const CreateWaitpointParams = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: CreateWaitpointRequest,
        response: {
            [StatusCodes.CREATED]: CreateWaitpointResponse,
        },
    },
}

type BuildBarrierStateParams = {
    flowRunId: string
    created: CreateBarrierResult
}
