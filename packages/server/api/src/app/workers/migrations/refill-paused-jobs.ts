import { FlowRunStatus, isNil, PauseType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In, MoreThan } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { redisConnections } from '../../database/redis-connections'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { WaitpointEntity } from '../../flows/flow-run/waitpoint/waitpoint-entity'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { jobQueue } from '../job-queue/job-queue'

const REFILL_PAUSED_RUNS_KEY = 'refill_paused_runs_v7'
const executionRetentionDays = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)
const waitpointRepo = repoFactory(WaitpointEntity)

export const refillPausedRuns = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const redisConnection = await redisConnections.useExisting()
        const isMigrated = await redisConnection.get(REFILL_PAUSED_RUNS_KEY)
        if (!isNil(isMigrated)) {
            log.info('[refillPausedRuns] Already migrated, skipping')
            return
        }

        log.info('[refillPausedRuns] Finding paused DELAY runs with waitpoints from pre-migration data')
        const pausedRuns = await flowRunRepo().find({
            where: {
                status: FlowRunStatus.PAUSED,
                created: MoreThan(dayjs().subtract(executionRetentionDays, 'day').toISOString()),
            },
        })

        if (pausedRuns.length === 0) {
            log.info('[refillPausedRuns] No paused runs found')
            await redisConnection.set(REFILL_PAUSED_RUNS_KEY, 'true')
            return
        }

        const flowRunIds = pausedRuns.map(r => r.id)
        const waitpoints = await waitpointRepo().findBy({ flowRunId: In(flowRunIds) })
        const waitpointByRunId = Object.fromEntries(waitpoints.map(w => [w.flowRunId, w]))

        let migratedCount = 0

        for (const pausedRun of pausedRuns) {
            const waitpoint = waitpointByRunId[pausedRun.id]
            if (isNil(waitpoint) || waitpoint.type !== PauseType.DELAY || isNil(waitpoint.resumeDateTime)) {
                continue
            }
            if (dayjs(pausedRun.created).isBefore(dayjs().subtract(executionRetentionDays, 'day'))) {
                continue
            }

            try {
                const sharedQueue = jobQueue(log).getSharedQueue()
                const job = await sharedQueue.getJob(pausedRun.id)
                await job?.remove()
            }
            catch (e) {
                log.error({ error: e, pausedRunId: pausedRun.id }, '[refillPausedRuns] Error removing job')
            }

            await systemJobsSchedule(log).upsertJob({
                job: {
                    name: SystemJobName.RESUME_DELAY_WAITPOINT,
                    data: { flowRunId: pausedRun.id, projectId: pausedRun.projectId, waitpointId: waitpoint.id },
                    jobId: `resume-delay-${pausedRun.id}`,
                },
                schedule: {
                    type: 'one-time',
                    date: dayjs(waitpoint.resumeDateTime),
                },
            })
            migratedCount++
        }

        log.info({ count: migratedCount }, '[refillPausedRuns] Migrated paused runs')
        await redisConnection.set(REFILL_PAUSED_RUNS_KEY, 'true')
    },
})

