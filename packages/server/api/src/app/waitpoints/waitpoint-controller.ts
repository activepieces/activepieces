import { isNil } from '@activepieces/core-utils'
import { ActivepiecesError, BarrierCreatedState, CreateWaitpointRequest, CreateWaitpointResponse, ErrorCode, MAX_INLINE_BARRIER_SIGNALS, PauseType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { domainHelper } from '../helper/domain-helper'
import { networkUtils } from '../helper/network-utils'
import { barrierService, CreateBarrierResult } from './barrier-service'
import { resumePageHooks } from './resume-page-hooks'
import { waitpointService } from './waitpoint-service'
import { WaitpointSignal } from './waitpoint-types'

export const waitpointController: FastifyPluginAsyncZod = async (app) => {
    app.post('/', CreateWaitpointParams, async (request, reply) => {
        const { flowRunId, projectId, stepName, type, version, resumeDateTime, responseToSend, workerHandlerId, httpRequestId, barrier } = request.body
        const platformId = request.principal.platform.id
        const publicApiUrl = await resumePageHooks.get(request.log).getPublicApiBaseUrl({ platformId })

        if (type === PauseType.BARRIER) {
            assertBarrierCarriesNoDeadline({ resumeDateTime })
            const created = await barrierService(request.log).create({
                flowRunId,
                projectId,
                platformId,
                stepName,
                version,
                responseToSend: responseToSend ?? undefined,
                workerHandlerId: workerHandlerId ?? undefined,
                httpRequestId: httpRequestId ?? undefined,
                policy: barrier?.policy,
                signalLabels: barrier?.signals?.map((signal) => signal.label ?? null),
                fanOut: barrier?.fanOut,
                timeoutSeconds: barrier?.timeoutSeconds,
            })
            return reply.status(StatusCodes.CREATED).send({
                id: created.barrier.id,
                ...await buildResumeUrls({ flowRunId, waitpointId: created.barrier.id, publicApiUrl }),
                barrier: buildBarrierState({ flowRunId, created, publicApiUrl }),
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
            ...await buildResumeUrls({ flowRunId, waitpointId: waitpoint.id, publicApiUrl }),
        })
    })
}

async function buildResumeUrls({ flowRunId, waitpointId, publicApiUrl }: BuildResumeUrlsParams): Promise<Pick<CreateWaitpointResponse, 'resumeUrl' | 'publicResumeUrl'>> {
    const path = `v1/flow-runs/${flowRunId}/waitpoints/${waitpointId}`
    return {
        resumeUrl: await domainHelper.getPublicApiUrl({ path }),
        publicResumeUrl: networkUtils.combineUrl(publicApiUrl, path),
    }
}

function buildBarrierState({ flowRunId, created, publicApiUrl }: BuildBarrierStateParams): BarrierCreatedState {
    const inlineable = created.signals.length > 0 && created.signals.length <= MAX_INLINE_BARRIER_SIGNALS && created.signals.every((signal) => isNil(signal.sequence))
    const truncatedForSize = created.signals.length > MAX_INLINE_BARRIER_SIGNALS
    return {
        signalCount: created.signalCount,
        batchSize: created.batchSize,
        ...(isNil(created.totalItems) ? {} : { totalItems: created.totalItems }),
        ...(truncatedForSize ? { signalsTruncated: true } : {}),
        ...(inlineable ? { signals: created.signals.map((signal) => toSignalLink({ flowRunId, signal, publicApiUrl })) } : {}),
    }
}

function toSignalLink({ flowRunId, signal, publicApiUrl }: { flowRunId: string, signal: WaitpointSignal, publicApiUrl: string }): { label: string | null, confirmUrl: string } {
    return {
        label: signal.label,
        confirmUrl: networkUtils.combineUrl(publicApiUrl, `v1/flow-runs/${flowRunId}/signals/${signal.id}/confirm`),
    }
}

function assertBarrierCarriesNoDeadline({ resumeDateTime }: { resumeDateTime: string | undefined }): void {
    if (isNil(resumeDateTime)) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: { message: 'A barrier sets its own deadline at creation, so resumeDateTime is not accepted here. Remove it, or open a plain DELAY waitpoint instead.' },
    })
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
    publicApiUrl: string
}

type BuildResumeUrlsParams = {
    flowRunId: string
    waitpointId: string
    publicApiUrl: string
}
