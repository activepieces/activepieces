import { chunk, isNil } from '@activepieces/core-utils'
import { FlowRunStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { systemJobIds, SystemJobName } from '../helper/system-jobs/common'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { WaitpointEntity } from './waitpoint-entity'
import { waitpointTimeoutJob } from './waitpoint-timeout-job'
import { Waitpoint, WaitpointStatus } from './waitpoint-types'

const waitpointRepo = repoFactory(WaitpointEntity)

export async function sweepOverdueDeadlines({ log, pageSize }: SweepOverdueDeadlinesParams): Promise<string[]> {
    const sweep = await runSweepPages({ log, pageSize: pageSize ?? SCAN_PAGE_SIZE })

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
    if (sweep.armed.length >= MAX_ARMED_PER_TICK) {
        log.warn({ armedCount: sweep.armed.length, scannedCount: sweep.scannedCount }, '[sweepOverdueDeadlines] Hit the per-tick arm quota; the oldest deadlines went first and the rest follow next tick')
    }
    if (sweep.exhaustedPageBudget) {
        log.warn({ scannedCount: sweep.scannedCount, armedCount: sweep.armed.length }, '[sweepOverdueDeadlines] Spent the per-tick scan budget without reaching the end of the overdue backlog; deadlines already armed elsewhere are holding the window and the remainder waits for the next tick')
    }
    return sweep.armed
}

async function runSweepPages({ log, pageSize }: RunSweepPagesParams): Promise<SweepOutcome> {
    const now = dayjs().toISOString()
    const armed: string[] = []
    const deadLettered: Waitpoint[] = []
    let scannedCount = 0
    let cursor: DeadlineCursor | undefined = undefined

    for (let page = 0; page < MAX_SCAN_PAGES_PER_TICK; page++) {
        const overdue = await findOverdueWaitpoints({ now, cursor, pageSize })
        if (overdue.length === 0) {
            return { armed, deadLettered, scannedCount, exhaustedPageBudget: false }
        }
        scannedCount += overdue.length
        cursor = toCursor(overdue[overdue.length - 1])

        const probes = await probeDeadlineJobs({ overdue, log })
        const pageDeadLettered = probes.filter((probe) => probe.state === 'dead-lettered').map((probe) => probe.waitpoint)
        await stampDeadLettered({ deadLettered: pageDeadLettered })
        deadLettered.push(...pageDeadLettered)

        const unarmed = probes.filter((probe) => probe.state === 'unarmed').map((probe) => probe.waitpoint)
        armed.push(...await armDeadlines({ unarmed, remainingQuota: MAX_ARMED_PER_TICK - armed.length, log }))

        if (armed.length >= MAX_ARMED_PER_TICK || overdue.length < pageSize) {
            return { armed, deadLettered, scannedCount, exhaustedPageBudget: false }
        }
    }
    return { armed, deadLettered, scannedCount, exhaustedPageBudget: true }
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
    const existingJob = await systemJobsSchedule(log).getJob<SystemJobName.RESUME_DELAY_WAITPOINT>(systemJobIds.resumeDelay({ waitpointId: waitpoint.id }))
    if (isNil(existingJob)) {
        return { waitpoint, state: 'unarmed' }
    }
    return { waitpoint, state: await existingJob.isFailed() ? 'dead-lettered' : 'armed' }
}

async function stampDeadLettered({ deadLettered }: StampDeadLetteredParams): Promise<void> {
    const stampedAt = dayjs().toISOString()
    const idsByProject = deadLettered.reduce<Record<string, string[]>>((grouped, waitpoint) => ({
        ...grouped,
        [waitpoint.projectId]: [...grouped[waitpoint.projectId] ?? [], waitpoint.id],
    }), {})
    await Promise.all(Object.entries(idsByProject).map(([projectId, ids]) =>
        waitpointRepo().update({ id: In(ids), projectId }, { deadLetteredAt: stampedAt }),
    ))
}

async function armDeadlines({ unarmed, remainingQuota, log }: ArmDeadlinesParams): Promise<string[]> {
    const armed: string[] = []
    for (const waitpoint of unarmed) {
        if (armed.length >= remainingQuota) {
            break
        }
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
    return armed
}

const SCAN_PAGE_SIZE = 500
const MAX_SCAN_PAGES_PER_TICK = 8
const MAX_ARMED_PER_TICK = 500
const DEADLINE_PROBE_CHUNK_SIZE = 50
const DEAD_LETTER_SAMPLE_SIZE = 10

type SweepOverdueDeadlinesParams = {
    log: FastifyBaseLogger
    pageSize?: number
}

type RunSweepPagesParams = {
    log: FastifyBaseLogger
    pageSize: number
}

type SweepOutcome = {
    armed: string[]
    deadLettered: Waitpoint[]
    scannedCount: number
    exhaustedPageBudget: boolean
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
}

type ArmDeadlinesParams = {
    unarmed: Waitpoint[]
    remainingQuota: number
    log: FastifyBaseLogger
}
