import { apId, chunk, isNil, sanitizeObjectForPostgresql, spreadIfDefined } from '@activepieces/core-utils'
import { apDayjsDuration, wideEvent } from '@activepieces/server-utils'
import { ActivepiecesError, BarrierPolicy, barrierReleasesOnLastPendingSignal, BarrierSignalCounts, BarrierSignalStatus, BarrierSummary, ErrorCode, MAX_INLINE_BARRIER_SIGNALS, PauseType, RespondResponse, shouldReleaseBarrier, WaitpointVersion } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, FindOptionsWhere, IsNull, Not } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { transaction } from '../core/db/transaction'
import { distributedStore } from '../database/redis-connections'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { barrierQueue } from './barrier-queue'
import { BarrierFanOutPayload, barrierSourceKey } from './barrier-queue-factory'
import { resumeService } from './resume-service'
import { WaitpointEntity } from './waitpoint-entity'
import { WaitpointSignalEntity } from './waitpoint-signal-entity'
import { waitpointTimeoutJob } from './waitpoint-timeout-job'
import { Waitpoint, WaitpointSignal, WaitpointStatus } from './waitpoint-types'

const waitpointRepo = repoFactory(WaitpointEntity)
const signalRepo = repoFactory(WaitpointSignalEntity)

export const barrierService = (log: FastifyBaseLogger) => ({
    async create(params: CreateBarrierParams): Promise<CreateBarrierResult> {
        const maxSignals = system.getNumberOrThrow(AppSystemProp.MAX_BARRIER_SIGNALS)
        const batchSize = clampBatchSize({ itemCount: params.fanOut?.items.length ?? 0, requested: params.fanOut?.batchSize ?? 1, maxSignals })
        const batches = isNil(params.fanOut) ? [] : chunk(params.fanOut.items, batchSize)
        const labels = params.signalLabels ?? []
        const signalCount = isNil(params.fanOut) ? labels.length : batches.length
        assertSignalCountWithinLimit({ signalCount, maxSignals })

        const creation = await transaction(async (entityManager) => {
            const repo = waitpointRepo(entityManager)
            const existing = await repo.findOneBy({ flowRunId: params.flowRunId, stepName: params.stepName })
            if (!isNil(existing) && existing.status === WaitpointStatus.PENDING) {
                log.info({ flowRun: { id: params.flowRunId }, waitpoint: { id: existing.id } }, '[barrierService#create] Barrier already open for this step, reusing it')
                return { inserted: false, barrier: existing, signals: await signalRepo(entityManager).findBy({ waitpointId: existing.id }) }
            }
            if (!isNil(existing)) {
                await repo.delete({ id: existing.id })
            }
            const id = apId()
            const deadline = defaultBarrierDeadline()
            await repo
                .createQueryBuilder()
                .insert()
                .into('waitpoint')
                .values({
                    id,
                    flowRunId: params.flowRunId,
                    projectId: params.projectId,
                    stepName: params.stepName,
                    type: PauseType.BARRIER,
                    version: params.version,
                    status: WaitpointStatus.PENDING,
                    resumeDateTime: deadline,
                    responseToSend: params.responseToSend ?? null,
                    workerHandlerId: params.workerHandlerId ?? null,
                    httpRequestId: params.httpRequestId ?? null,
                    resumePayload: null,
                    sealed: true,
                    policy: params.policy ?? null,
                })
                .execute()
            const signals = buildPendingSignals({ barrierId: id, projectId: params.projectId, signalCount, labels, fanOut: !isNil(params.fanOut) })
            for (const rows of chunk(signals, SIGNAL_INSERT_BATCH_SIZE)) {
                await signalRepo(entityManager).createQueryBuilder().insert().into('waitpoint_signal').values(rows).execute()
            }
            const barrier = await repo.findOneByOrFail({ id })
            return { inserted: true, barrier, signals }
        })

        if (creation.inserted) {
            if (!isNil(params.fanOut)) {
                const payload: BarrierFanOutPayload = { entryStepName: params.fanOut.entryStepName, seedSteps: params.fanOut.seedSteps, batches }
                await distributedStore.put(barrierSourceKey(creation.barrier.id), payload, SOURCE_TTL_SECONDS)
                await barrierQueue(log).addFanOutDispatch({ barrierId: creation.barrier.id, projectId: params.projectId })
            }
            if (!isNil(creation.barrier.resumeDateTime)) {
                await waitpointTimeoutJob.schedule({
                    flowRunId: params.flowRunId,
                    projectId: params.projectId,
                    waitpointId: creation.barrier.id,
                    resumeDateTime: creation.barrier.resumeDateTime,
                    log,
                })
            }
            await barrierQueue(log).enqueueEvaluation({ barrierId: creation.barrier.id, projectId: params.projectId })
        }

        return { barrier: creation.barrier, signals: creation.signals, signalCount: creation.signals.length, batchSize }
    },

    async findById({ barrierId, projectId }: FindByIdParams): Promise<Waitpoint | null> {
        return waitpointRepo().findOneBy({ id: barrierId, projectId, type: PauseType.BARRIER })
    },

    async findSignalById({ signalId, projectId }: FindSignalByIdParams): Promise<WaitpointSignal | null> {
        return signalRepo().findOneBy({ id: signalId, projectId })
    },

    async listUnclaimedSignals({ barrierId, projectId }: BarrierScopeParams): Promise<WaitpointSignal[]> {
        return signalRepo().find({
            where: unclaimedSignalWhere({ barrierId, projectId }),
            order: { sequence: 'ASC' },
        })
    },

    async claimSignal({ signalId, refId, projectId }: ClaimSignalParams): Promise<boolean> {
        const claimed = await signalRepo().query(
            'UPDATE waitpoint_signal SET "refId" = $1, "updated" = now() WHERE "id" = $2 AND "projectId" = $3 AND "refId" IS NULL AND "status" = $4 RETURNING "id"',
            [refId, signalId, projectId, BarrierSignalStatus.PENDING],
        )
        return Array.isArray(claimed) && claimed.length > 0
    },

    async releaseClaim({ signalId, refId, projectId }: ClaimSignalParams): Promise<void> {
        await signalRepo().update({ id: signalId, refId, projectId }, { refId: null })
    },

    async countClaimedSignals({ barrierId, projectId }: BarrierScopeParams): Promise<number> {
        return signalRepo().countBy({ waitpointId: barrierId, projectId, status: BarrierSignalStatus.PENDING, refId: Not(IsNull()) })
    },

    async markUnclaimedNotDispatched({ barrierId, projectId }: BarrierScopeParams): Promise<number> {
        const result = await signalRepo().update(unclaimedSignalWhere({ barrierId, projectId }), { status: BarrierSignalStatus.NOT_DISPATCHED })
        return result.affected ?? 0
    },

    async receiveSignal(params: ReceiveSignalParams): Promise<WaitpointSignal | null> {
        if (isNil(params.signalId) && isNil(params.refId)) {
            return null
        }
        const signal = isNil(params.signalId)
            ? await signalRepo().findOneBy({ refId: params.refId, projectId: params.projectId })
            : await signalRepo().findOneBy({ id: params.signalId, projectId: params.projectId })
        if (isNil(signal)) {
            log.warn({
                ...spreadIfDefined('flowRun', isNil(params.refId) ? undefined : { id: params.refId }),
                ...spreadIfDefined('signal', isNil(params.signalId) ? undefined : { id: params.signalId }),
                project: { id: params.projectId },
                outcome: params.status,
            }, '[barrierService#receive] No signal row matched this outcome, so it is being dropped; the barrier was released or the row was never claimed by this ref')
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
        const barrier = await waitpointRepo().findOneBy({ id: barrierId, projectId, type: PauseType.BARRIER, status: WaitpointStatus.PENDING })
        if (isNil(barrier)) {
            return
        }
        if (!await isReadyToRelease({ barrier, projectId })) {
            return
        }
        await this.release({ barrier, timedOut: false, releaseReason: 'predicate' })
    },

    async release({ barrier, timedOut, releaseReason }: ReleaseParams): Promise<BarrierSummary | null> {
        const summary = await closeBarrier({ barrier, timedOut })
        await distributedStore.delete(barrierSourceKey(barrier.id))
        const finalSummary = summary ?? readStoredSummary(await waitpointRepo().findOneBy({ id: barrier.id }))
        if (isNil(finalSummary)) {
            return null
        }
        if (!isNil(summary)) {
            wideEvent.set({
                fanIn: {
                    barrierId: barrier.id,
                    signalCount: summary.total,
                    releaseReason,
                    stillRunning: summary.stillRunning,
                },
            })
        }
        await resumeService(log).resumeTrusted({
            flowRunId: barrier.flowRunId,
            waitpointId: barrier.id,
            resumePayload: { body: finalSummary, headers: {}, queryParams: {} },
        })
        return finalSummary
    },
})

function buildPendingSignals({ barrierId, projectId, signalCount, labels, fanOut }: BuildPendingSignalsParams): WaitpointSignal[] {
    const now = new Date().toISOString()
    return Array.from({ length: signalCount }, (_, index) => ({
        id: apId(),
        created: now,
        updated: now,
        waitpointId: barrierId,
        projectId,
        status: BarrierSignalStatus.PENDING,
        refId: null,
        sequence: fanOut ? index : null,
        label: labels[index] ?? null,
        result: null,
    }))
}

function unclaimedSignalWhere({ barrierId, projectId }: BarrierScopeParams): FindOptionsWhere<WaitpointSignal> {
    return { waitpointId: barrierId, projectId, status: BarrierSignalStatus.PENDING, refId: IsNull() }
}

async function closeBarrier({ barrier, timedOut }: CloseBarrierParams): Promise<BarrierSummary | null> {
    return transaction(async (entityManager) => {
        const repo = waitpointRepo(entityManager)
        const lockedBarrier = await repo
            .createQueryBuilder('waitpoint')
            .setLock('pessimistic_write')
            .where({ id: barrier.id, status: WaitpointStatus.PENDING })
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

function clampBatchSize({ itemCount, requested, maxSignals }: ClampBatchSizeParams): number {
    const minimumBatchSize = Math.ceil(itemCount / maxSignals)
    return Math.max(requested, minimumBatchSize, 1)
}

function assertSignalCountWithinLimit({ signalCount, maxSignals }: { signalCount: number, maxSignals: number }): void {
    if (signalCount > maxSignals) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `This step waits on ${signalCount} things, which exceeds the maximum of ${maxSignals}. Wait on fewer, or raise AP_MAX_BARRIER_SIGNALS.` },
        })
    }
}

function defaultBarrierDeadline(): string {
    const maxDurationInDays = system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS)
    return dayjs().add(maxDurationInDays, 'day').toISOString()
}

function readStoredSummary(waitpoint: Waitpoint | null): BarrierSummary | null {
    if (isNil(waitpoint) || waitpoint.status !== WaitpointStatus.COMPLETED) {
        return null
    }
    const parsed = BarrierSummary.safeParse(waitpoint.resumePayload?.body)
    return parsed.success ? parsed.data : null
}

const SIGNAL_INSERT_BATCH_SIZE = 500

const SOURCE_TTL_SECONDS = apDayjsDuration(1, 'day').asSeconds()

export type BarrierReleaseReason = 'predicate' | 'timeout'

export type CreateBarrierParams = {
    flowRunId: string
    projectId: string
    stepName: string
    version: WaitpointVersion
    responseToSend?: RespondResponse
    workerHandlerId?: string
    httpRequestId?: string
    policy?: BarrierPolicy
    signalLabels?: (string | null)[]
    fanOut?: {
        entryStepName: string
        batchSize: number
        items: unknown[]
        seedSteps: Record<string, unknown>
    }
}

export type CreateBarrierResult = {
    barrier: Waitpoint
    signals: WaitpointSignal[]
    signalCount: number
    batchSize: number
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

type BarrierScopeParams = {
    barrierId: string
    projectId: string
}

type ClaimSignalParams = {
    signalId: string
    refId: string
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
    signalCount: number
    labels: (string | null)[]
    fanOut: boolean
}

type ClampBatchSizeParams = {
    itemCount: number
    requested: number
    maxSignals: number
}

