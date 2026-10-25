import { isNil, tryCatch } from '@activepieces/core-utils'
import { FlowRun } from '@activepieces/shared'
import { UnrecoverableError } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import pLimit from 'p-limit'
import { transaction } from '../core/db/transaction'
import { distributedStore } from '../database/redis-connections'
import { ChildDispatchTarget, childRunDispatchService } from '../flows/flow-run/child-run-dispatch-service'

import { shouldBlockRunOnCredits } from '../platform/billing-provider'
import { barrierQueue } from './barrier-queue'
import { BarrierFanOutPayload, BarrierJobData, barrierSourceKey } from './barrier-queue-factory'
import { barrierService, SignalClaim } from './barrier-service'
import { WaitpointStatus } from './waitpoint-types'

export async function handleFanOutDispatch({ data, log }: JobParams): Promise<void> {
    const barrier = await barrierService(log).findById({ barrierId: data.barrierId, projectId: data.projectId })
    if (isNil(barrier) || barrier.status !== WaitpointStatus.PENDING) {
        log.info({ waitpoint: { id: data.barrierId } }, '[fanOutDispatcher] Barrier is gone or already released, stopping without dispatching')
        return
    }

    const source = await distributedStore.get<BarrierFanOutPayload>(barrierSourceKey(data.barrierId))
    if (isNil(source)) {
        const notDispatchedCount = await settleUnclaimedSignals({ data, log })
        log.warn({ waitpoint: { id: data.barrierId }, notDispatchedCount }, '[fanOutDispatcher] The stored source is gone, marking the unclaimed signals undispatched so the barrier can settle')
        return
    }

    if (!await barrierService(log).hasUnclaimedSignals({ barrierId: data.barrierId, projectId: data.projectId })) {
        await barrierQueue(log).enqueueEvaluation({ barrierId: data.barrierId, projectId: data.projectId })
        return
    }

    const target = await childRunDispatchService(log).prepareChildDispatch({
        projectId: data.projectId,
        parentRunId: barrier.flowRunId,
        entryStepName: source.entryStepName,
    })
    const outcome = await dispatchChunks({ data, source, target, log })
    switch (outcome) {
        case 'barrier-closed':
            log.info({ waitpoint: { id: data.barrierId } }, '[fanOutDispatcher] The barrier was released or cancelled mid-fan-out, stopping without retrying')
            return
        case 'credits-exhausted': {
            const notDispatchedCount = await settleUnclaimedSignals({ data, log })
            log.warn({ waitpoint: { id: data.barrierId }, platform: { id: target.platformId }, notDispatchedCount }, '[fanOutDispatcher] The platform ran out of run credits, marking the unclaimed signals undispatched')
            return
        }
        case 'dispatched':
            await barrierQueue(log).enqueueEvaluation({ barrierId: data.barrierId, projectId: data.projectId })
    }
}

export function fanOutDispatchGaveUp({ attemptsMade, attempts, error }: FanOutDispatchGaveUpParams): GiveUpReason | null {
    if (error instanceof UnrecoverableError) {
        return 'unrecoverable'
    }
    if (attemptsMade >= (attempts ?? 1)) {
        return 'exhausted'
    }
    return null
}

export async function handleFanOutDispatchFailed({ data, attemptsMade, attempts, error, log }: HandleFanOutDispatchFailedParams): Promise<void> {
    const reason = fanOutDispatchGaveUp({ attemptsMade, attempts, error })
    if (isNil(reason)) {
        return
    }
    log.error({ error, waitpoint: { id: data.barrierId }, giveUpReason: reason }, '[fanOutDispatcher] Dispatch gave up, queueing the settlement of its unclaimed signals')
    await barrierQueue(log).addFanOutGiveUp(data)
}

export async function handleFanOutDispatchGaveUp({ data, log }: JobParams): Promise<void> {
    await distributedStore.delete(barrierSourceKey(data.barrierId))
    const notDispatchedCount = await settleUnclaimedSignals({ data, log })
    log.warn({ waitpoint: { id: data.barrierId }, notDispatchedCount }, '[fanOutDispatcher] Marked the unclaimed signals undispatched after dispatch gave up; signals already claimed keep their live children and release the barrier once those report')
}

async function dispatchChunks({ data, source, target, log }: DispatchChunksParams): Promise<DispatchOutcome> {
    let afterSequence: number | null = START_OF_BARRIER
    while (!isNil(afterSequence)) {
        if (await shouldBlockRunOnCredits({ platformId: target.platformId, environment: target.environment, log })) {
            return 'credits-exhausted'
        }
        const cursor: number = afterSequence
        const chunk = await transaction(async (entityManager) => {
            const claimResult = await barrierService(log).claimNextSignals({ barrierId: data.barrierId, projectId: data.projectId, afterSequence: cursor, limit: CLAIM_CHUNK_SIZE, entityManager })
            if (!claimResult.barrierOpen) {
                return null
            }
            const childRuns = await childRunDispatchService(log).createChildRuns({
                target,
                parentWaitpointId: data.barrierId,
                children: claimResult.claims.map((claim) => ({ id: claim.childRunId, dispatchIndex: claim.sequence })),
                entityManager,
            })
            return { claims: claimResult.claims, childRuns, lastSequence: claimResult.lastSequence }
        })
        if (isNil(chunk)) {
            return 'barrier-closed'
        }
        const outcomes = await enqueueChunk({ data, source, target, claims: chunk.claims, childRuns: chunk.childRuns, log })
        if (outcomes.includes('barrier-closed')) {
            return 'barrier-closed'
        }
        afterSequence = chunk.lastSequence ?? (cursor === START_OF_BARRIER ? null : START_OF_BARRIER)
    }
    return 'dispatched'
}

async function enqueueChunk({ data, source, target, claims, childRuns, log }: EnqueueChunkParams): Promise<EnqueueOutcome[]> {
    const limit = pLimit(MAX_ENQUEUES_IN_FLIGHT)
    const results = await Promise.allSettled(claims.map((claim, index) => limit(() => enqueueChild({
        data,
        claim,
        childRun: childRuns[index],
        seedSteps: { ...source.seedSteps, [source.batchStepName]: { type: BATCH_STEP_TYPE, status: 'SUCCEEDED', input: {}, output: { items: source.batches[claim.sequence] ?? [] } } },
        target,
        log,
    }))))
    const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
    if (!isNil(failure)) {
        throw failure.reason
    }
    return results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
}

async function enqueueChild({ data, claim, childRun, seedSteps, target, log }: EnqueueChildParams): Promise<EnqueueOutcome> {
    const attempt = await transaction(async (entityManager): Promise<EnqueueAttempt> => {
        const barrierOpen = await barrierService(log).lockForDispatch({ barrierId: data.barrierId, projectId: data.projectId, entityManager })
        if (!barrierOpen) {
            return { outcome: 'barrier-closed' }
        }
        const { error } = await tryCatch(() => childRunDispatchService(log).enqueueChildRun({ target, childRun, seedSteps }))
        if (isNil(error)) {
            return { outcome: 'enqueued' }
        }
        await childRunDispatchService(log).deleteChildRun({ id: childRun.id, projectId: data.projectId, entityManager })
        await barrierService(log).releaseClaim({ signalId: claim.signalId, refId: childRun.id, projectId: data.projectId, entityManager })
        return { outcome: 'failed', error }
    })
    switch (attempt.outcome) {
        case 'enqueued':
            await childRunDispatchService(log).reportChildRunStarted({ target, childRun })
            return 'enqueued'
        case 'barrier-closed':
            await childRunDispatchService(log).cancelUnstartedChildRun({ target, childRun })
            return 'barrier-closed'
        case 'failed':
            await settleIfDispatchGaveUp({ data, log })
            throw attempt.error
    }
}

async function settleIfDispatchGaveUp({ data, log }: JobParams): Promise<void> {
    if (await distributedStore.exists(barrierSourceKey(data.barrierId))) {
        return
    }
    const notDispatchedCount = await settleUnclaimedSignals({ data, log })
    log.warn({ waitpoint: { id: data.barrierId }, notDispatchedCount }, '[fanOutDispatcher] A claim was released after dispatch gave up, marking it undispatched so the barrier can settle')
}

async function settleUnclaimedSignals({ data, log }: JobParams): Promise<number> {
    const notDispatchedCount = await barrierService(log).markUnclaimedNotDispatched({ barrierId: data.barrierId, projectId: data.projectId })
    await barrierQueue(log).enqueueEvaluation({ barrierId: data.barrierId, projectId: data.projectId })
    return notDispatchedCount
}

const BATCH_STEP_TYPE = 'PROCESS_IN_BATCHES'

const START_OF_BARRIER = -1

const CLAIM_CHUNK_SIZE = 25

const MAX_ENQUEUES_IN_FLIGHT = 5

type DispatchOutcome = 'dispatched' | 'barrier-closed' | 'credits-exhausted'

type EnqueueOutcome = 'enqueued' | 'barrier-closed'

type EnqueueAttempt =
    | { outcome: EnqueueOutcome }
    | { outcome: 'failed', error: Error }

type JobParams = {
    data: BarrierJobData
    log: FastifyBaseLogger
}

type HandleFanOutDispatchFailedParams = {
    data: BarrierJobData
    attemptsMade: number
    attempts?: number
    error: Error
    log: FastifyBaseLogger
}

type FanOutDispatchGaveUpParams = {
    attemptsMade: number
    attempts?: number
    error: Error
}

type DispatchChunksParams = {
    data: BarrierJobData
    source: BarrierFanOutPayload
    target: ChildDispatchTarget
    log: FastifyBaseLogger
}

type EnqueueChunkParams = DispatchChunksParams & {
    claims: SignalClaim[]
    childRuns: FlowRun[]
}

type EnqueueChildParams = {
    data: BarrierJobData
    claim: SignalClaim
    childRun: FlowRun
    seedSteps: Record<string, unknown>
    target: ChildDispatchTarget
    log: FastifyBaseLogger
}

export type GiveUpReason = 'exhausted' | 'unrecoverable'
