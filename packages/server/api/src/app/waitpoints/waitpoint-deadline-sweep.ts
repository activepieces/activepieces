import { chunk, isNil, tryCatch } from '@activepieces/core-utils'
import { wideEvent } from '@activepieces/server-utils'
import { FlowRunStatus, PauseType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In, LessThanOrEqual } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { distributedStore } from '../database/redis-connections'
import { systemJobIds } from '../helper/system-jobs/common'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { barrierQueue } from './barrier-queue'
import { WaitpointEntity } from './waitpoint-entity'
import { waitpointTimeoutJob } from './waitpoint-timeout-job'
import { Waitpoint, WaitpointStatus } from './waitpoint-types'

const waitpointRepo = repoFactory(WaitpointEntity)

export async function sweepOverdueDeadlines({ log, pageSize, maxPages, maxRedelivered }: SweepOverdueDeadlinesParams): Promise<string[]> {
    const sweep = await runSweepPages({
        log,
        pageSize: pageSize ?? SCAN_PAGE_SIZE,
        maxPages: maxPages ?? MAX_SCAN_PAGES_PER_TICK,
    })

    if (sweep.armed.length > 0) {
        log.info({ armedCount: sweep.armed.length, scannedCount: sweep.scannedCount }, '[sweepOverdueDeadlines] Re-armed overdue waitpoint deadlines')
    }
    if (sweep.deadLettered.length > 0) {
        log.warn({
            deadLetteredCount: sweep.deadLettered.length,
            scannedCount: sweep.scannedCount,
            sample: sweep.deadLettered.slice(0, DEAD_LETTER_SAMPLE_SIZE).map((waitpoint) => waitpoint.id),
        }, '[sweepOverdueDeadlines] Deadlines exhausted their attempts and leave the scan for good rather than spending its budget every tick; their runs stay paused until someone intervenes')
    }
    if (!isNil(sweep.resumeFrom)) {
        log.warn({
            stopReason: sweep.stopReason,
            scannedCount: sweep.scannedCount,
            armedCount: sweep.armed.length,
            resumeFrom: sweep.resumeFrom,
        }, '[sweepOverdueDeadlines] Spent the per-tick budget without reaching the end of the overdue backlog; the next tick carries on from where this one stopped rather than re-reading the rows it already classified')
    }

    const redelivery = await redeliverUndeliveredBarriers({ log, maxRedelivered: maxRedelivered ?? MAX_REDELIVERED_PER_TICK })

    wideEvent.set({
        waitpointSweep: {
            scannedCount: sweep.scannedCount,
            armedCount: sweep.armed.length,
            deadLetteredCount: sweep.deadLettered.length,
            stopReason: sweep.stopReason,
            deadlineBacklogCarried: !isNil(sweep.resumeFrom),
            barriersEnqueuedCount: redelivery.enqueued,
            barrierBacklogCarried: redelivery.backlogCarried,
        },
    })
    return sweep.armed
}

async function redeliverUndeliveredBarriers({ log, maxRedelivered }: RedeliverUndeliveredBarriersParams): Promise<RedeliveryOutcome> {
    const cursor = await readBarrierCursor()
    const undelivered = await findUndeliveredBarriers({
        staleBefore: dayjs().subtract(UNDELIVERED_BARRIER_GRACE_MINUTES, 'minute').toISOString(),
        cursor,
        limit: maxRedelivered,
    })
    if (undelivered.length === 0) {
        await rememberBarrierCursor(undefined)
        return { enqueued: 0, backlogCarried: false }
    }
    log.warn({
        undeliveredCount: undelivered.length,
        resumedFrom: cursor,
        sample: undelivered.slice(0, DEAD_LETTER_SAMPLE_SIZE).map((barrier) => barrier.id),
    }, '[redeliverUndeliveredBarriers] Found barriers closed but never delivered, so the release that closed them died before dispatching; handing each one back to the barrier queue, which owns the retries')
    const enqueued = await enqueueBarrierEvaluations({ undelivered, log })
    const backlogCarried = undelivered.length >= maxRedelivered
    const resumeFrom = backlogCarried ? toBarrierCursor(undelivered[undelivered.length - 1]) : undefined
    await rememberBarrierCursor(resumeFrom)
    if (!isNil(resumeFrom)) {
        log.warn({
            enqueuedCount: enqueued,
            resumeFrom,
        }, '[redeliverUndeliveredBarriers] Filled the per-tick batch without reaching the end of the undelivered barriers; the next tick carries on past them rather than re-reading the same oldest rows every minute')
    }
    return { enqueued, backlogCarried }
}

async function enqueueBarrierEvaluations({ undelivered, log }: EnqueueBarrierEvaluationsParams): Promise<number> {
    const outcomes = await Promise.all(undelivered.map(async (barrier) => {
        const { error } = await tryCatch(() => barrierQueue(log).enqueueEvaluation({ barrierId: barrier.id, projectId: barrier.projectId }))
        if (!isNil(error)) {
            log.error({ error, waitpoint: { id: barrier.id }, flowRun: { id: barrier.flowRunId } }, '[redeliverUndeliveredBarriers] Could not hand an undelivered barrier back to the queue, so the rest of this batch carries on and the next tick tries it again')
            return false
        }
        return true
    }))
    return outcomes.filter(Boolean).length
}

async function findUndeliveredBarriers({ staleBefore, cursor, limit }: FindUndeliveredBarriersParams): Promise<Waitpoint[]> {
    const query = waitpointRepo()
        .createQueryBuilder('waitpoint')
        .innerJoin('flow_run', 'flowRun', '"flowRun"."id" = "waitpoint"."flowRunId"')
        .where('"waitpoint"."type" = :type', { type: PauseType.BARRIER })
        .andWhere('"waitpoint"."status" = :status', { status: WaitpointStatus.COMPLETED })
        .andWhere('"waitpoint"."updated" < :staleBefore', { staleBefore })
        .andWhere('"flowRun"."status" = :runStatus', { runStatus: FlowRunStatus.PAUSED })
    if (!isNil(cursor)) {
        query.andWhere('("waitpoint"."updated", "waitpoint"."id") > (:cursorUpdated, :cursorId)', {
            cursorUpdated: cursor.updated,
            cursorId: cursor.id,
        })
    }
    return query
        .orderBy('"waitpoint"."updated"', 'ASC')
        .addOrderBy('"waitpoint"."id"', 'ASC')
        .limit(limit)
        .getMany()
}

async function readBarrierCursor(): Promise<BarrierRecoveryCursor | undefined> {
    const stored = await distributedStore.get<BarrierRecoveryCursor>(BARRIER_RECOVERY_CURSOR_KEY)
    return stored ?? undefined
}

async function rememberBarrierCursor(cursor: BarrierRecoveryCursor | undefined): Promise<void> {
    if (isNil(cursor)) {
        await distributedStore.delete(BARRIER_RECOVERY_CURSOR_KEY)
        return
    }
    await distributedStore.put(BARRIER_RECOVERY_CURSOR_KEY, cursor, DEADLINE_SWEEP_CURSOR_TTL_SECONDS)
}

function toBarrierCursor(barrier: Waitpoint): BarrierRecoveryCursor {
    return { updated: barrier.updated, id: barrier.id }
}

async function runSweepPages({ log, pageSize, maxPages }: RunSweepPagesParams): Promise<SweepOutcome> {
    const scanStartedAt = await readDatabaseTime()
    const armed: string[] = []
    const deadLettered: Waitpoint[] = []
    let scannedCount = 0
    let cursor = await readStoredCursor()

    for (let page = 0; page < maxPages; page++) {
        const overdue = await findOverdueWaitpoints({ now: scanStartedAt, cursor, pageSize })
        if (overdue.length === 0) {
            return finishSweep({ armed, deadLettered, scannedCount, resumeFrom: undefined, stopReason: 'drained' })
        }
        scannedCount += overdue.length

        const probes = await probeDeadlineJobs({ overdue, log })
        const pageDeadLettered = probes.filter((probe) => probe.state === 'dead-lettered').map((probe) => probe.waitpoint)
        await stampDeadLettered({ deadLettered: pageDeadLettered, scanStartedAt })
        deadLettered.push(...pageDeadLettered)

        const unarmed = probes.filter((probe) => probe.state === 'unarmed').map((probe) => probe.waitpoint)
        const arming = await armDeadlines({ unarmed, remainingQuota: MAX_ARMED_PER_TICK - armed.length, log })
        armed.push(...arming.armed)

        if (arming.quotaExhausted) {
            const resumeFrom = isNil(arming.lastHandled) ? cursor : toCursor(arming.lastHandled)
            return finishSweep({ armed, deadLettered, scannedCount, resumeFrom, stopReason: 'arm-quota' })
        }

        cursor = toCursor(overdue[overdue.length - 1])
        if (overdue.length < pageSize) {
            return finishSweep({ armed, deadLettered, scannedCount, resumeFrom: undefined, stopReason: 'drained' })
        }
    }
    return finishSweep({ armed, deadLettered, scannedCount, resumeFrom: cursor, stopReason: 'page-budget' })
}

async function finishSweep({ armed, deadLettered, scannedCount, resumeFrom, stopReason }: SweepOutcome): Promise<SweepOutcome> {
    await rememberCursor(resumeFrom)
    return { armed, deadLettered, scannedCount, resumeFrom, stopReason }
}

async function readStoredCursor(): Promise<DeadlineCursor | undefined> {
    const stored = await distributedStore.get<DeadlineCursor>(DEADLINE_SWEEP_CURSOR_KEY)
    return stored ?? undefined
}

async function rememberCursor(cursor: DeadlineCursor | undefined): Promise<void> {
    if (isNil(cursor)) {
        await distributedStore.delete(DEADLINE_SWEEP_CURSOR_KEY)
        return
    }
    await distributedStore.put(DEADLINE_SWEEP_CURSOR_KEY, cursor, DEADLINE_SWEEP_CURSOR_TTL_SECONDS)
}

async function readDatabaseTime(): Promise<string> {
    const rows = await waitpointRepo().query<{ now: Date }[]>('SELECT now() AS now')
    return dayjs(rows[0].now).toISOString()
}

function toCursor(waitpoint: Waitpoint): DeadlineCursor | undefined {
    return isNil(waitpoint.resumeDateTime) ? undefined : { resumeDateTime: waitpoint.resumeDateTime, id: waitpoint.id }
}

async function findOverdueWaitpoints({ now, cursor, pageSize }: FindOverdueWaitpointsParams): Promise<Waitpoint[]> {
    const query = waitpointRepo()
        .createQueryBuilder('waitpoint')
        .innerJoin('flow_run', 'flowRun', '"flowRun"."id" = "waitpoint"."flowRunId"')
        .where('"waitpoint"."status" = :status', { status: WaitpointStatus.PENDING })
        .andWhere('"waitpoint"."resumeDateTime" < :now', { now })
        .andWhere('"waitpoint"."deadLetteredAt" IS NULL')
        .andWhere('"flowRun"."status" = :runStatus', { runStatus: FlowRunStatus.PAUSED })
    if (!isNil(cursor)) {
        query.andWhere('("waitpoint"."resumeDateTime", "waitpoint"."id") > (:cursorResumeDateTime, :cursorId)', {
            cursorResumeDateTime: cursor.resumeDateTime,
            cursorId: cursor.id,
        })
    }
    return query
        .orderBy('"waitpoint"."resumeDateTime"', 'ASC')
        .addOrderBy('"waitpoint"."id"', 'ASC')
        .limit(pageSize)
        .getMany()
}

async function probeDeadlineJobs({ overdue, log }: ProbeDeadlineJobsParams): Promise<DeadlineProbe[]> {
    const resolvedChunks: DeadlineProbe[][] = []
    for (const batch of chunk(overdue, DEADLINE_PROBE_CHUNK_SIZE)) {
        resolvedChunks.push(await Promise.all(batch.map((waitpoint) => probeDeadlineJob({ waitpoint, log }))))
    }
    return resolvedChunks.flat()
}

async function probeDeadlineJob({ waitpoint, log }: ProbeDeadlineJobParams): Promise<DeadlineProbe> {
    const jobState = await systemJobsSchedule(log).getJobState(systemJobIds.resumeDelay({ waitpointId: waitpoint.id }))
    if (jobState === 'unknown') {
        return { waitpoint, state: 'unarmed' }
    }
    return { waitpoint, state: jobState === 'failed' ? 'dead-lettered' : 'armed' }
}

async function stampDeadLettered({ deadLettered, scanStartedAt }: StampDeadLetteredParams): Promise<void> {
    const stampedAt = dayjs().toISOString()
    const idsByProject = deadLettered.reduce<Record<string, string[]>>((grouped, waitpoint) => ({
        ...grouped,
        [waitpoint.projectId]: [...grouped[waitpoint.projectId] ?? [], waitpoint.id],
    }), {})
    await Promise.all(Object.entries(idsByProject).map(([projectId, ids]) =>
        waitpointRepo().update({ id: In(ids), projectId, updated: LessThanOrEqual(scanStartedAt) }, { deadLetteredAt: stampedAt }),
    ))
}

async function armDeadlines({ unarmed, remainingQuota, log }: ArmDeadlinesParams): Promise<ArmOutcome> {
    const armed: string[] = []
    let lastHandled: Waitpoint | undefined = undefined
    for (const waitpoint of unarmed) {
        if (armed.length >= remainingQuota) {
            return { armed, quotaExhausted: true, lastHandled }
        }
        lastHandled = waitpoint
        if (isNil(waitpoint.resumeDateTime)) {
            continue
        }
        const { status } = await waitpointTimeoutJob.schedule({
            flowRunId: waitpoint.flowRunId,
            projectId: waitpoint.projectId,
            waitpointId: waitpoint.id,
            resumeDateTime: waitpoint.resumeDateTime,
            log,
        })
        if (status === 'added') {
            armed.push(waitpoint.id)
        }
    }
    return { armed, quotaExhausted: false, lastHandled }
}

const SCAN_PAGE_SIZE = 500
const MAX_SCAN_PAGES_PER_TICK = 8
const MAX_ARMED_PER_TICK = 500
const DEADLINE_PROBE_CHUNK_SIZE = 50
const DEAD_LETTER_SAMPLE_SIZE = 10
const DEADLINE_SWEEP_CURSOR_TTL_SECONDS = 600
const UNDELIVERED_BARRIER_GRACE_MINUTES = 2
const MAX_REDELIVERED_PER_TICK = 100

export const DEADLINE_SWEEP_CURSOR_KEY = 'waitpoint:deadline-sweep:cursor'
export const BARRIER_RECOVERY_CURSOR_KEY = 'waitpoint:barrier-recovery:cursor'

type SweepOverdueDeadlinesParams = {
    log: FastifyBaseLogger
    pageSize?: number
    maxPages?: number
    maxRedelivered?: number
}

type RedeliverUndeliveredBarriersParams = {
    log: FastifyBaseLogger
    maxRedelivered: number
}

type RedeliveryOutcome = {
    enqueued: number
    backlogCarried: boolean
}

type EnqueueBarrierEvaluationsParams = {
    undelivered: Waitpoint[]
    log: FastifyBaseLogger
}

type FindUndeliveredBarriersParams = {
    staleBefore: string
    cursor: BarrierRecoveryCursor | undefined
    limit: number
}

type BarrierRecoveryCursor = {
    updated: string
    id: string
}

type RunSweepPagesParams = {
    log: FastifyBaseLogger
    pageSize: number
    maxPages: number
}

type SweepOutcome = {
    armed: string[]
    deadLettered: Waitpoint[]
    scannedCount: number
    resumeFrom: DeadlineCursor | undefined
    stopReason: 'drained' | 'arm-quota' | 'page-budget'
}

type DeadlineCursor = {
    resumeDateTime: string
    id: string
}

type DeadlineProbe = {
    waitpoint: Waitpoint
    state: 'unarmed' | 'armed' | 'dead-lettered'
}

type FindOverdueWaitpointsParams = {
    now: string
    cursor: DeadlineCursor | undefined
    pageSize: number
}

type ProbeDeadlineJobsParams = {
    overdue: Waitpoint[]
    log: FastifyBaseLogger
}

type ProbeDeadlineJobParams = {
    waitpoint: Waitpoint
    log: FastifyBaseLogger
}

type StampDeadLetteredParams = {
    deadLettered: Waitpoint[]
    scanStartedAt: string
}

type ArmDeadlinesParams = {
    unarmed: Waitpoint[]
    remainingQuota: number
    log: FastifyBaseLogger
}

type ArmOutcome = {
    armed: string[]
    quotaExhausted: boolean
    lastHandled: Waitpoint | undefined
}
