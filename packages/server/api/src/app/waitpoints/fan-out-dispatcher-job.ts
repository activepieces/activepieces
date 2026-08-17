import { apId, isNil, tryCatch } from '@activepieces/core-utils'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import pLimit from 'p-limit'
import { distributedStore } from '../database/redis-connections'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { barrierQueue } from './barrier-queue'
import { BarrierFanOutPayload, BarrierJobData, barrierSourceKey } from './barrier-queue-factory'
import { barrierService } from './barrier-service'
import { WaitpointStatus } from './waitpoint-types'

export async function handleFanOutDispatch({ data, log }: HandleFanOutDispatchParams): Promise<void> {
    const barrier = await barrierService(log).findById({ barrierId: data.barrierId, projectId: data.projectId })
    if (isNil(barrier) || barrier.status !== WaitpointStatus.PENDING) {
        log.info({ fanIn: { barrierId: data.barrierId } }, '[fanOutDispatcher] Barrier is gone or already released, stopping without dispatching')
        return
    }

    const source = await distributedStore.get<BarrierFanOutPayload>(barrierSourceKey(data.barrierId))
    if (isNil(source)) {
        const notDispatchedCount = await barrierService(log).markRemainingNotDispatched({ barrierId: data.barrierId, projectId: data.projectId })
        log.warn({ fanIn: { barrierId: data.barrierId, notDispatchedCount } }, '[fanOutDispatcher] The stored source is gone, releasing the barrier with an undispatched verdict')
        await barrierQueue(log).addEvaluation({ barrierId: data.barrierId, projectId: data.projectId })
        return
    }

    const signals = await barrierService(log).listUnclaimedSignals({ barrierId: data.barrierId, projectId: data.projectId })
    if (signals.length === 0) {
        await barrierQueue(log).addEvaluation({ barrierId: data.barrierId, projectId: data.projectId })
        return
    }

    const target = await flowRunService(log).prepareChildDispatch({
        projectId: data.projectId,
        parentRunId: barrier.flowRunId,
        entryStepName: source.entryStepName,
    })
    const limit = pLimit(MAX_DISPATCHES_IN_FLIGHT)
    let cancelled = false

    await Promise.all(signals.map((signal) => limit(async () => {
        if (cancelled) {
            return
        }
        const sequence = signal.sequence ?? 0
        const batch = source.batches[sequence] ?? []
        const childRunId = apId()
        const claimed = await barrierService(log).claimSignal({ signalId: signal.id, refId: childRunId, projectId: data.projectId })
        if (!claimed) {
            return
        }
        const { error } = await tryCatch(() => flowRunService(log).dispatchChild({
            target,
            childRunId,
            seedSteps: { ...source.seedSteps, [barrier.stepName]: batchStepOutput(batch) },
            parentWaitpointId: barrier.id,
            dispatchIndex: sequence,
            dispatchKey: `${barrier.id}-${sequence}`,
        }))
        if (isNil(error)) {
            return
        }
        await barrierService(log).releaseClaim({ signalId: signal.id, refId: childRunId, projectId: data.projectId })
        if (isBarrierGone(error)) {
            cancelled = true
            log.info({ fanIn: { barrierId: data.barrierId } }, '[fanOutDispatcher] The barrier was cancelled mid-fan-out, stopping without retrying')
            return
        }
        throw error
    })))

    if (cancelled) {
        return
    }
    await barrierQueue(log).addEvaluation({ barrierId: data.barrierId, projectId: data.projectId })
}

export async function handleFanOutDispatchExhausted({ data, error, log }: HandleFanOutDispatchExhaustedParams): Promise<void> {
    const notDispatchedCount = await barrierService(log).markRemainingNotDispatched({ barrierId: data.barrierId, projectId: data.projectId })
    log.error({ error, fanIn: { barrierId: data.barrierId, notDispatchedCount } }, '[fanOutDispatcher] Dispatch exhausted its attempts, marking the rest undispatched so the barrier releases now instead of at its deadline')
    await barrierQueue(log).addEvaluation({ barrierId: data.barrierId, projectId: data.projectId })
}

function batchStepOutput(items: unknown[]): unknown {
    return {
        type: 'PROCESS_IN_BATCHES',
        status: 'SUCCEEDED',
        input: {},
        output: { items },
    }
}

function isBarrierGone(error: unknown): boolean {
    return error instanceof ActivepiecesError && error.error.code === ErrorCode.ENTITY_NOT_FOUND
}

const MAX_DISPATCHES_IN_FLIGHT = 5

type HandleFanOutDispatchParams = {
    data: BarrierJobData
    log: FastifyBaseLogger
}

type HandleFanOutDispatchExhaustedParams = {
    data: BarrierJobData
    error: Error
    log: FastifyBaseLogger
}
