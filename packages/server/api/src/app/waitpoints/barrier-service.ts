import { apId, chunk, isNil, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
import { apDayjsDuration, wideEvent } from '@activepieces/server-utils'
import { ActivepiecesError, BarrierPolicy, BarrierSignalCounts, BarrierSignalStatus, BarrierSummary, ErrorCode, MAX_INLINE_BARRIER_SIGNALS, PauseType, RespondResponse, shouldReleaseBarrier, WaitpointVersion } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, IsNull } from 'typeorm'
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
        assertWithinSignalLimit({ signalCount, maxSignals })

        const created = await transaction(async (entityManager) => {
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
            const deadline = resolveDeadline()
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
            const signals = buildSignalRows({ barrierId: id, projectId: params.projectId, signalCount, labels, fanOut: !isNil(params.fanOut) })
            for (const rows of chunk(signals, SIGNAL_INSERT_CHUNK)) {
                await signalRepo(entityManager).createQueryBuilder().insert().into('waitpoint_signal').values(rows).execute()
            }
            const barrier = await repo.findOneByOrFail({ id })
            return { inserted: true, barrier, signals }
        })

        if (created.inserted) {
            if (!isNil(params.fanOut)) {
                const payload: BarrierFanOutPayload = { entryStepName: params.fanOut.entryStepName, seedSteps: params.fanOut.seedSteps, batches }
                await distributedStore.put(barrierSourceKey(created.barrier.id), payload, SOURCE_TTL_SECONDS)
                await barrierQueue(log).addFanOutDispatch({ barrierId: created.barrier.id, projectId: params.projectId })
            }
            if (!isNil(created.barrier.resumeDateTime)) {
                await waitpointTimeoutJob.schedule({
                    flowRunId: params.flowRunId,
                    projectId: params.projectId,
                    waitpointId: created.barrier.id,
                    resumeDateTime: created.barrier.resumeDateTime,
                    log,
                })
            }
            await barrierQueue(log).addEvaluation({ barrierId: created.barrier.id, projectId: params.projectId })
        }

        return { barrier: created.barrier, signals: created.signals, signalCount: created.signals.length, batchSize }
    },

    async findById({ barrierId, projectId }: FindByIdParams): Promise<Waitpoint | null> {
        return waitpointRepo().findOneBy({ id: barrierId, projectId, type: PauseType.BARRIER })
    },

    async findSignalById({ signalId, projectId }: FindSignalByIdParams): Promise<WaitpointSignal | null> {
        return signalRepo().findOneBy({ id: signalId, projectId })
    },

    async listUnclaimedSignals({ barrierId, projectId }: BarrierScopeParams): Promise<WaitpointSignal[]> {
        return signalRepo().find({
            where: { waitpointId: barrierId, projectId, status: BarrierSignalStatus.PENDING, refId: IsNull() },
            order: { sequence: 'ASC' },
        })
    },

    async claimSignal({ signalId, refId, projectId }: ClaimSignalParams): Promise<boolean> {
        const claimed = await signalRepo().query(
            'UPDATE waitpoint_signal SET "refId" = $1, "updated" = now() WHERE "id" = $2 AND "projectId" = $3 AND "refId" IS NULL RETURNING "id"',
            [refId, signalId, projectId],
        )
        return Array.isArray(claimed) && claimed.length > 0
    },

    async releaseClaim({ signalId, refId, projectId }: ClaimSignalParams): Promise<void> {
        await signalRepo().update({ id: signalId, refId, projectId }, { refId: null })
    },

    async markRemainingNotDispatched({ barrierId, projectId }: BarrierScopeParams): Promise<number> {
        const result = await signalRepo().update({ waitpointId: barrierId, projectId, status: BarrierSignalStatus.PENDING }, { status: BarrierSignalStatus.NOT_DISPATCHED })
        return result.affected ?? 0
    },

    async receive(params: ReceiveSignalParams): Promise<WaitpointSignal | null> {
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
        await barrierQueue(log).addEvaluation({ barrierId: signal.waitpointId, projectId: signal.projectId })
        return signal
    },

    async evaluate({ barrierId, projectId }: EvaluateParams): Promise<void> {
        const barrier = await waitpointRepo().findOneBy({ id: barrierId, projectId, type: PauseType.BARRIER, status: WaitpointStatus.PENDING })
        if (isNil(barrier)) {
            return
        }
        const counts = await countSignalsByStatus({ barrierId: barrier.id, projectId })
        if (!shouldReleaseBarrier({ policy: barrier.policy, sealed: barrier.sealed, counts })) {
            return
        }
        await this.release({ barrier, timedOut: false, releaseReason: 'predicate' })
    },

    async release({ barrier, timedOut, releaseReason }: ReleaseParams): Promise<BarrierSummary | null> {
        const summary = await completeAndDrainSignals({ barrier, timedOut })
        await distributedStore.delete(barrierSourceKey(barrier.id))
        const released = summary ?? asStoredSummary(await waitpointRepo().findOneBy({ id: barrier.id }))
        if (isNil(released)) {
            return null
        }
        if (!isNil(summary)) {
            wideEvent.set({
                fanIn: {
                    barrierId: barrier.id,
                    signalCount: summary.total,
                    releaseReason,
                    stragglers: summary.stillRunning,
                },
            })
        }
        await resumeService(log).releaseBarrier({
            flowRunId: barrier.flowRunId,
            waitpointId: barrier.id,
            resumePayload: { body: released, headers: {}, queryParams: {} },
        })
        return released
    },
})

function buildSignalRows({ barrierId, projectId, signalCount, labels, fanOut }: BuildSignalRowsParams): WaitpointSignal[] {
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

async function completeAndDrainSignals({ barrier, timedOut }: CompleteAndDrainParams): Promise<BarrierSummary | null> {
    return transaction(async (entityManager) => {
        const repo = waitpointRepo(entityManager)
        const pending = await repo
            .createQueryBuilder('waitpoint')
            .setLock('pessimistic_write')
            .where({ id: barrier.id, status: WaitpointStatus.PENDING })
            .getOne()
        if (isNil(pending)) {
            return null
        }
        const summary = await buildSummary({ barrierId: pending.id, projectId: pending.projectId, timedOut, entityManager })
        await repo.save({
            ...pending,
            status: WaitpointStatus.COMPLETED,
            resumePayload: { body: summary, headers: {}, queryParams: {} },
        })
        await signalRepo(entityManager).delete({ waitpointId: pending.id, projectId: pending.projectId })
        return summary
    })
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

function assertWithinSignalLimit({ signalCount, maxSignals }: { signalCount: number, maxSignals: number }): void {
    if (signalCount > maxSignals) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `This step waits on ${signalCount} things, which exceeds the maximum of ${maxSignals}. Wait on fewer, or raise AP_MAX_BARRIER_SIGNALS.` },
        })
    }
}

function resolveDeadline(): string {
    const maxDurationInDays = system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS)
    return dayjs().add(maxDurationInDays, 'day').toISOString()
}

function asStoredSummary(waitpoint: Waitpoint | null): BarrierSummary | null {
    if (isNil(waitpoint) || waitpoint.status !== WaitpointStatus.COMPLETED) {
        return null
    }
    const parsed = BarrierSummary.safeParse(waitpoint.resumePayload?.body)
    return parsed.success ? parsed.data : null
}

const SIGNAL_INSERT_CHUNK = 500

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

type EvaluateParams = {
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

type CompleteAndDrainParams = {
    barrier: Waitpoint
    timedOut: boolean
}

type CountSignalsByStatusParams = {
    barrierId: string
    projectId: string
    entityManager?: EntityManager
}

type BuildSummaryParams = CountSignalsByStatusParams & {
    timedOut: boolean
}

type BuildSignalRowsParams = {
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
