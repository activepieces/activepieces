import { chunk, isNil } from '@activepieces/core-utils'
import { FlowRunStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { systemJobIds, SystemJobName } from '../helper/system-jobs/common'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { WaitpointEntity } from './waitpoint-entity'
import { waitpointTimeoutJob } from './waitpoint-timeout-job'
import { Waitpoint, WaitpointStatus } from './waitpoint-types'

const waitpointRepo = repoFactory(WaitpointEntity)

export async function sweepOverdueDeadlines({ log }: SweepOverdueDeadlinesParams): Promise<string[]> {
    const overdue = await findOverdueWaitpoints()
    const probes = await probeDeadlineJobs({ overdue, log })
    const unarmed = probes.filter((probe) => probe.state === 'unarmed').map((probe) => probe.waitpoint)
    const deadLettered = probes.filter((probe) => probe.state === 'dead-lettered').map((probe) => probe.waitpoint)
    const armed = await armDeadlines({ unarmed, log })

    if (armed.length > 0) {
        log.info({ armedCount: armed.length, scannedCount: overdue.length }, '[sweepOverdueDeadlines] Re-armed overdue waitpoint deadlines')
    }
    if (deadLettered.length > 0) {
        log.warn({
            deadLetteredCount: deadLettered.length,
            scannedCount: overdue.length,
            scanWindowFull: overdue.length >= SWEEP_SCAN_LIMIT,
            sample: deadLettered.slice(0, DEAD_LETTER_SAMPLE_SIZE).map((waitpoint) => waitpoint.id),
        }, '[sweepOverdueDeadlines] Deadlines exhausted their attempts and stay dead-lettered rather than being re-armed every tick; their runs stay paused until someone intervenes')
    }
    if (armed.length >= MAX_ARMED_PER_TICK) {
        log.warn({ armedCount: armed.length, scannedCount: overdue.length }, '[sweepOverdueDeadlines] Hit the per-tick arm quota; the oldest deadlines went first and the rest follow next tick')
    }
    return armed
}

async function findOverdueWaitpoints(): Promise<Waitpoint[]> {
    const maxDurationInDays = system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS)
    return waitpointRepo()
        .createQueryBuilder('waitpoint')
        .innerJoin('flow_run', 'flowRun', '"flowRun"."id" = "waitpoint"."flowRunId"')
        .where('"waitpoint"."status" = :status', { status: WaitpointStatus.PENDING })
        .andWhere('"waitpoint"."resumeDateTime" < :now', { now: dayjs().toISOString() })
        .andWhere('"waitpoint"."resumeDateTime" > :floor', { floor: dayjs().subtract(maxDurationInDays, 'day').toISOString() })
        .andWhere('"flowRun"."status" = :runStatus', { runStatus: FlowRunStatus.PAUSED })
        .orderBy('"waitpoint"."resumeDateTime"', 'ASC')
        .limit(SWEEP_SCAN_LIMIT)
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

async function armDeadlines({ unarmed, log }: ArmDeadlinesParams): Promise<string[]> {
    const armed: string[] = []
    for (const waitpoint of unarmed) {
        if (armed.length >= MAX_ARMED_PER_TICK) {
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

const SWEEP_SCAN_LIMIT = 2000
const MAX_ARMED_PER_TICK = 500
const DEADLINE_PROBE_CHUNK_SIZE = 50
const DEAD_LETTER_SAMPLE_SIZE = 10

type SweepOverdueDeadlinesParams = {
    log: FastifyBaseLogger
}

type DeadlineProbe = {
    waitpoint: Waitpoint
    state: 'unarmed' | 'armed' | 'dead-lettered'
}

type ProbeDeadlineJobsParams = {
    overdue: Waitpoint[]
    log: FastifyBaseLogger
}

type ProbeDeadlineJobParams = {
    waitpoint: Waitpoint
    log: FastifyBaseLogger
}

type ArmDeadlinesParams = {
    unarmed: Waitpoint[]
    log: FastifyBaseLogger
}
