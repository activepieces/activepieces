import { apId, chunk, isNil, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/core-utils'
import { wideEvent } from '@activepieces/server-utils'
import { ActivepiecesError, BarrierPolicy, barrierReleasesOnLastPendingSignal, BarrierSignalCounts, BarrierSignalStatus, BarrierSummary, ErrorCode, MAX_INLINE_BARRIER_SIGNALS, PauseType, RespondResponse, shouldReleaseBarrier, WaitpointVersion } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { transaction } from '../core/db/transaction'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { platformConfigurationService } from '../platform/platform-configuration.service'
import { barrierQueue } from './barrier-queue'
import { resumeService } from './resume-service'
import { WaitpointEntity } from './waitpoint-entity'
import { WaitpointSignalEntity } from './waitpoint-signal-entity'
import { Waitpoint, WaitpointSignal, WaitpointStatus } from './waitpoint-types'

const waitpointRepo = repoFactory(WaitpointEntity)
const signalRepo = repoFactory(WaitpointSignalEntity)

export const barrierService = (log: FastifyBaseLogger) => ({
    async create(params: CreateBarrierParams): Promise<CreateBarrierResult> {
        const labels = params.signalLabels ?? []
        await assertSignalCountWithinLimit({ signalCount: labels.length, platformId: params.platformId, log })

        const creation = await transaction(async (entityManager) => {
            const repo = waitpointRepo(entityManager)
            const existing = await repo.findOneBy({ flowRunId: params.flowRunId, projectId: params.projectId, stepName: params.stepName })
            if (!isNil(existing) && existing.status === WaitpointStatus.PENDING) {
                log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id: existing.id } }, '[barrierService#create] Barrier already open for this step, reusing it')
                return { inserted: false, barrier: existing, signals: await signalRepo(entityManager).findBy({ waitpointId: existing.id, projectId: params.projectId }) }
            }
            if (!isNil(existing)) {
                await repo.delete({ id: existing.id, projectId: params.projectId })
            }
            const now = dayjs().toISOString()
            const barrier: Waitpoint = {
                id: apId(),
                created: now,
                updated: now,
                flowRunId: params.flowRunId,
                projectId: params.projectId,
                stepName: params.stepName,
                type: PauseType.BARRIER,
                version: params.version,
                status: WaitpointStatus.PENDING,
                resumeDateTime: defaultBarrierDeadline(),
                responseToSend: params.responseToSend ?? null,
                workerHandlerId: params.workerHandlerId ?? null,
                httpRequestId: params.httpRequestId ?? null,
                resumePayload: null,
                sealed: true,
                policy: params.policy ?? null,
            }
            await repo.createQueryBuilder().insert().into('waitpoint').values(barrier).execute()
            const signals = buildPendingSignals({ barrierId: barrier.id, projectId: params.projectId, labels })
            for (const rows of chunk(signals, SIGNAL_INSERT_BATCH_SIZE)) {
                await signalRepo(entityManager).createQueryBuilder().insert().into('waitpoint_signal').values(rows).execute()
            }
            return { inserted: true, barrier, signals }
        })

        if (creation.inserted) {
            await barrierQueue(log).enqueueEvaluation({ barrierId: creation.barrier.id, projectId: params.projectId })
        }

        return { barrier: creation.barrier, signals: creation.signals, signalCount: creation.signals.length }
    },

    async findById({ barrierId, projectId }: FindByIdParams): Promise<Waitpoint | null> {
        return waitpointRepo().findOneBy({ id: barrierId, projectId, type: PauseType.BARRIER })
    },

    async findSignalById({ signalId, projectId }: FindSignalByIdParams): Promise<WaitpointSignal | null> {
        return signalRepo().findOneBy({ id: signalId, projectId })
    },

    async receiveSignal(params: ReceiveSignalParams): Promise<WaitpointSignal | null> {
        if (isNil(params.signalId) && isNil(params.refId)) {
            return null
        }
        const signal = isNil(params.signalId)
            ? await signalRepo().findOneBy({ refId: params.refId, projectId: params.projectId })
            : await signalRepo().findOneBy({ id: params.signalId, projectId: params.projectId })
        if (isNil(signal)) {
            return null
        }
        await signalRepo().save({
            ...signal,
            status: params.status,
            result: isNil(params.result) ? null : sanitizeObjectForPostgresql(params.result),
        })
        await barrierQueue(log).enqueueEvaluation({ barrierId: signal.waitpointId, projectId: signal.projectId })
        return signal
    },

    async releaseIfReady({ barrierId, projectId }: ReleaseIfReadyParams): Promise<void> {
        const barrier = await waitpointRepo().findOneBy({ id: barrierId, projectId, type: PauseType.BARRIER })
        if (isNil(barrier)) {
            return
        }
        if (barrier.status === WaitpointStatus.COMPLETED) {
            await redeliverClosedBarrier({ barrier, log })
            return
        }
        if (barrier.status !== WaitpointStatus.PENDING) {
            return
        }
        if (!await isReadyToRelease({ barrier, projectId })) {
            return
        }
        await this.release({ barrier, timedOut: false, releaseReason: 'predicate' })
    },

    async release({ barrier, timedOut, releaseReason }: ReleaseParams): Promise<BarrierSummary | null> {
        const summary = await closeBarrier({ barrier, timedOut })
        if (isNil(summary)) {
            log.info({ waitpoint: { id: barrier.id }, flowRun: { id: barrier.flowRunId } }, '[barrierService#release] Barrier was already closed by another release; leaving the resume to the release that closed it')
            return null
        }
        wideEvent.set({
            fanIn: {
                barrierId: barrier.id,
                signalCount: summary.total,
                releaseReason,
                stillRunning: summary.stillRunning,
            },
        })
        await resumeService(log).resumeTrusted({
            flowRunId: barrier.flowRunId,
            waitpointId: barrier.id,
            resumePayload: { body: summary, headers: {}, queryParams: {} },
        })
        return summary
    },
})

function buildPendingSignals({ barrierId, projectId, labels }: BuildPendingSignalsParams): WaitpointSignal[] {
    const now = new Date().toISOString()
    return labels.map((label) => ({
        id: apId(),
        created: now,
        updated: now,
        waitpointId: barrierId,
        projectId,
        status: BarrierSignalStatus.PENDING,
        refId: null,
        sequence: null,
        label,
        result: null,
    }))
}

async function closeBarrier({ barrier, timedOut }: CloseBarrierParams): Promise<BarrierSummary | null> {
    return transaction(async (entityManager) => {
        const repo = waitpointRepo(entityManager)
        const lockedBarrier = await repo
            .createQueryBuilder('waitpoint')
            .setLock('pessimistic_write')
            .where({ id: barrier.id, projectId: barrier.projectId, status: WaitpointStatus.PENDING })
            .getOne()
        if (isNil(lockedBarrier)) {
            return null
        }
        const summary = await buildSummary({ barrierId: lockedBarrier.id, projectId: lockedBarrier.projectId, timedOut, entityManager })
        await repo.save({
            ...lockedBarrier,
            status: WaitpointStatus.COMPLETED,
            resumePayload: { body: summary, headers: {}, queryParams: {} },
        })
        await signalRepo(entityManager).delete({ waitpointId: lockedBarrier.id, projectId: lockedBarrier.projectId })
        return summary
    })
}

async function redeliverClosedBarrier({ barrier, log }: RedeliverClosedBarrierParams): Promise<void> {
    log.warn({ waitpoint: { id: barrier.id }, flowRun: { id: barrier.flowRunId } }, '[barrierService#redeliverClosedBarrier] Barrier was closed but never delivered; re-dispatching the persisted summary')
    const { error } = await tryCatch(() => resumeService(log).resumeTrusted({
        flowRunId: barrier.flowRunId,
        waitpointId: barrier.id,
        resumePayload: barrier.resumePayload,
    }))
    if (!isNil(error)) {
        log.error({ error, waitpoint: { id: barrier.id }, flowRun: { id: barrier.flowRunId } }, '[barrierService#redeliverClosedBarrier] Re-dispatching a closed barrier failed')
    }
}

async function isReadyToRelease({ barrier, projectId }: IsReadyToReleaseParams): Promise<boolean> {
    const { policy, sealed } = barrier
    if (barrierReleasesOnLastPendingSignal({ policy, sealed })) {
        return !await signalRepo().existsBy({ waitpointId: barrier.id, projectId, status: BarrierSignalStatus.PENDING })
    }
    const counts = await countSignalsByStatus({ barrierId: barrier.id, projectId })
    return shouldReleaseBarrier({ policy, sealed, counts })
}

async function countSignalsByStatus({ barrierId, projectId, entityManager }: CountSignalsByStatusParams): Promise<BarrierSignalCounts> {
    const rows = await signalRepo(entityManager)
        .createQueryBuilder('signal')
        .select('signal."status"', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('signal."waitpointId" = :barrierId', { barrierId })
        .andWhere('signal."projectId" = :projectId', { projectId })
        .groupBy('signal."status"')
        .getRawMany<{ status: BarrierSignalStatus, count: string }>()
    return rows.reduce<BarrierSignalCounts>((accumulated, row) => ({ ...accumulated, [row.status]: Number(row.count) }), {})
}

async function buildSummary({ barrierId, projectId, timedOut, entityManager }: BuildSummaryParams): Promise<BarrierSummary> {
    const counts = await countSignalsByStatus({ barrierId, projectId, entityManager })
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
    const inlineSignals = total <= MAX_INLINE_BARRIER_SIGNALS
        ? await signalRepo(entityManager).find({ where: { waitpointId: barrierId, projectId }, order: { sequence: 'ASC', created: 'ASC' } })
        : null

    return {
        total,
        succeeded: counts[BarrierSignalStatus.SUCCEEDED] ?? 0,
        failed: counts[BarrierSignalStatus.FAILED] ?? 0,
        rejected: counts[BarrierSignalStatus.REJECTED] ?? 0,
        canceled: counts[BarrierSignalStatus.CANCELED] ?? 0,
        notDispatched: counts[BarrierSignalStatus.NOT_DISPATCHED] ?? 0,
        stillRunning: counts[BarrierSignalStatus.PENDING] ?? 0,
        timedOut,
        ...(isNil(inlineSignals)
            ? { signalsTruncated: true }
            : {
                signals: inlineSignals.map((signal) => ({
                    sequence: signal.sequence,
                    label: signal.label,
                    outcome: signal.status,
                    result: signal.result ?? null,
                    runId: signal.refId,
                })),
            }),
    }
}

async function assertSignalCountWithinLimit({ signalCount, platformId, log }: AssertSignalCountWithinLimitParams): Promise<void> {
    const maxSignals = await platformConfigurationService(log).maxBarrierSignals({ platformId })
    if (signalCount > maxSignals) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `This step waits on ${signalCount} things, which exceeds the maximum of ${maxSignals}. Wait on fewer things.` },
        })
    }
}

function defaultBarrierDeadline(): string {
    const maxDurationInDays = system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS)
    return dayjs().add(maxDurationInDays, 'day').toISOString()
}

const SIGNAL_INSERT_BATCH_SIZE = 500

export type BarrierReleaseReason = 'predicate' | 'timeout'

export type CreateBarrierParams = {
    flowRunId: string
    projectId: string
    platformId: string
    stepName: string
    version: WaitpointVersion
    responseToSend?: RespondResponse
    workerHandlerId?: string
    httpRequestId?: string
    policy?: BarrierPolicy
    signalLabels?: (string | null)[]
}

export type CreateBarrierResult = {
    barrier: Waitpoint
    signals: WaitpointSignal[]
    signalCount: number
}

export type ReceiveSignalParams = {
    signalId?: string
    refId?: string
    projectId: string
    status: BarrierSignalStatus
    result?: Record<string, unknown>
}

type FindSignalByIdParams = {
    signalId: string
    projectId: string
}

type ReleaseIfReadyParams = {
    barrierId: string
    projectId: string
}

type FindByIdParams = {
    barrierId: string
    projectId: string
}

type ReleaseParams = {
    barrier: Waitpoint
    timedOut: boolean
    releaseReason: BarrierReleaseReason
}

type CloseBarrierParams = {
    barrier: Waitpoint
    timedOut: boolean
}

type RedeliverClosedBarrierParams = {
    barrier: Waitpoint
    log: FastifyBaseLogger
}

type IsReadyToReleaseParams = {
    barrier: Waitpoint
    projectId: string
}

type CountSignalsByStatusParams = {
    barrierId: string
    projectId: string
    entityManager?: EntityManager
}

type BuildSummaryParams = CountSignalsByStatusParams & {
    timedOut: boolean
}

type BuildPendingSignalsParams = {
    barrierId: string
    projectId: string
    labels: (string | null)[]
}

type AssertSignalCountWithinLimitParams = {
    signalCount: number
    platformId: string
    log: FastifyBaseLogger
}
