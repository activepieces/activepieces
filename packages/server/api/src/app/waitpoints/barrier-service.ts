import { apId, chunk, isNil, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
import { wideEvent } from '@activepieces/server-utils'
import { ActivepiecesError, BarrierPolicy, barrierReleasesOnLastPendingSignal, BarrierSignalCounts, BarrierSignalStatus, BarrierSummary, ErrorCode, MAX_INLINE_BARRIER_SIGNALS, PauseType, RespondResponse, shouldReleaseBarrier, WaitpointVersion } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { transaction } from '../core/db/transaction'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { barrierQueue } from './barrier-queue'
import { resumeService } from './resume-service'
import { WaitpointEntity } from './waitpoint-entity'
import { WaitpointSignalEntity } from './waitpoint-signal-entity'
import { waitpointTimeoutJob } from './waitpoint-timeout-job'
import { Waitpoint, WaitpointSignal, WaitpointStatus } from './waitpoint-types'

const waitpointRepo = repoFactory(WaitpointEntity)
const signalRepo = repoFactory(WaitpointSignalEntity)

export const barrierService = (log: FastifyBaseLogger) => ({
    async create(params: CreateBarrierParams): Promise<CreateBarrierResult> {
        const labels = params.signalLabels ?? []
        assertWithinSignalLimit({ signalCount: labels.length })

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
                    resumeDateTime: resolveDeadline(),
                    responseToSend: params.responseToSend ?? null,
                    workerHandlerId: params.workerHandlerId ?? null,
                    httpRequestId: params.httpRequestId ?? null,
                    resumePayload: null,
                    sealed: true,
                    policy: params.policy ?? null,
                })
                .execute()
            const signals = buildSignalRows({ barrierId: id, projectId: params.projectId, labels })
            for (const rows of chunk(signals, SIGNAL_INSERT_CHUNK)) {
                await signalRepo(entityManager).createQueryBuilder().insert().into('waitpoint_signal').values(rows).execute()
            }
            const barrier = await repo.findOneByOrFail({ id })
            return { inserted: true, barrier, signals }
        })

        if (created.inserted) {
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

        return { barrier: created.barrier, signals: created.signals, signalCount: created.signals.length }
    },

    async findById({ barrierId, projectId }: FindByIdParams): Promise<Waitpoint | null> {
        return waitpointRepo().findOneBy({ id: barrierId, projectId, type: PauseType.BARRIER })
    },

    async findSignalById({ signalId, projectId }: FindSignalByIdParams): Promise<WaitpointSignal | null> {
        return signalRepo().findOneBy({ id: signalId, projectId })
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
        if (!await passesReleasePredicate({ barrier, projectId })) {
            return
        }
        await this.release({ barrier, timedOut: false, releaseReason: 'predicate' })
    },

    async release({ barrier, timedOut, releaseReason }: ReleaseParams): Promise<BarrierSummary | null> {
        const summary = await completeAndDrainSignals({ barrier, timedOut })
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

function buildSignalRows({ barrierId, projectId, labels }: BuildSignalRowsParams): WaitpointSignal[] {
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

async function passesReleasePredicate({ barrier, projectId }: PassesReleasePredicateParams): Promise<boolean> {
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

function assertWithinSignalLimit({ signalCount }: { signalCount: number }): void {
    const maxSignals = system.getNumberOrThrow(AppSystemProp.MAX_BARRIER_SIGNALS)
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

type PassesReleasePredicateParams = {
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

type BuildSignalRowsParams = {
    barrierId: string
    projectId: string
    labels: (string | null)[]
}
