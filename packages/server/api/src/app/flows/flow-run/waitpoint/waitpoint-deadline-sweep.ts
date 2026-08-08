import { isNil } from '@activepieces/core-utils'
import { FlowRunStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { systemJobIds, SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'
import { WaitpointEntity } from './waitpoint-entity'
import { waitpointTimeoutJob } from './waitpoint-timeout-job'
import { WaitpointStatus } from './waitpoint-types'

const waitpointRepo = repoFactory(WaitpointEntity)
const SWEEP_BATCH_SIZE = 500

export async function sweepOverdueDeadlines({ log }: SweepOverdueDeadlinesParams): Promise<string[]> {
    const maxDurationInDays = system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS)
    const overdue = await waitpointRepo()
        .createQueryBuilder('waitpoint')
        .innerJoin('flow_run', 'flowRun', '"flowRun"."id" = "waitpoint"."flowRunId"')
        .where('"waitpoint"."status" = :status', { status: WaitpointStatus.PENDING })
        .andWhere('"waitpoint"."resumeDateTime" < :now', { now: dayjs().toISOString() })
        .andWhere('"waitpoint"."resumeDateTime" > :floor', { floor: dayjs().subtract(maxDurationInDays, 'day').toISOString() })
        .andWhere('"flowRun"."status" = :runStatus', { runStatus: FlowRunStatus.PAUSED })
        .orderBy('"waitpoint"."resumeDateTime"', 'DESC')
        .limit(SWEEP_BATCH_SIZE)
        .getMany()

    const rearmed: string[] = []
    for (const waitpoint of overdue) {
        if (isNil(waitpoint.resumeDateTime)) {
            continue
        }
        const existingJob = await systemJobsSchedule(log).getJob<SystemJobName.RESUME_DELAY_WAITPOINT>(systemJobIds.resumeDelay({ waitpointId: waitpoint.id }))
        if (!isNil(existingJob) && await existingJob.isFailed()) {
            log.warn({ flowRun: { id: waitpoint.flowRunId }, waitpoint: { id: waitpoint.id } }, '[sweepOverdueDeadlines] Deadline job exhausted its attempts, leaving it dead-lettered instead of re-arming it every tick')
            continue
        }
        await waitpointTimeoutJob.schedule({
            flowRunId: waitpoint.flowRunId,
            projectId: waitpoint.projectId,
            waitpointId: waitpoint.id,
            resumeDateTime: waitpoint.resumeDateTime,
            log,
        })
        rearmed.push(waitpoint.id)
    }

    if (rearmed.length > 0) {
        log.info({ overdueCount: rearmed.length }, '[sweepOverdueDeadlines] Re-armed overdue waitpoint deadlines')
    }
    if (overdue.length >= SWEEP_BATCH_SIZE) {
        log.warn({ overdueCount: overdue.length }, '[sweepOverdueDeadlines] Overdue backlog filled the sweep batch, the newest deadlines go first so a stuck prefix cannot starve them and the rest follow once these drain')
    }
    return rearmed
}

type SweepOverdueDeadlinesParams = {
    log: FastifyBaseLogger
}
