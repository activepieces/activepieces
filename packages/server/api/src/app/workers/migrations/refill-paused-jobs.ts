import { apId, ExecutionType, FlowRunStatus, isNil, LATEST_JOB_DATA_SCHEMA_VERSION, ProgressUpdateType, UploadLogsBehavior, WorkerJobType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { MoreThan } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { redisConnections } from '../../database/redis-connections'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { flowRunLogsService } from '../../flows/flow-run/logs/flow-run-logs-service'
import { WaitpointEntity } from '../../flows/flow-run/waitpoint/waitpoint-entity'
import { Waitpoint, WaitpointType } from '../../flows/flow-run/waitpoint/waitpoint-types'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { projectService } from '../../project/project-service'
import { jobQueue, JobType } from '../job-queue/job-queue'

const REFILL_PAUSED_RUNS_KEY = 'refill_paused_runs_v6'
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

        let migratedCount = 0

        for (const pausedRun of pausedRuns) {
            const waitpoint = await waitpointRepo().findOneBy({ flowRunId: pausedRun.id }) as Waitpoint | null
            if (isNil(waitpoint) || waitpoint.type !== WaitpointType.DELAY || isNil(waitpoint.resumeDateTime)) {
                continue
            }
            if (dayjs(pausedRun.created).isBefore(dayjs().subtract(executionRetentionDays, 'day'))) {
                continue
            }

            const logsFileId = pausedRun.logsFileId ?? apId()
            const logsUploadUrl = await flowRunLogsService(log).constructUploadUrl({
                flowRunId: pausedRun.id,
                logsFileId,
                behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
                projectId: pausedRun.projectId,
            })
            try {
                const sharedQueue = jobQueue(log).getSharedQueue()
                const job = await sharedQueue.getJob(pausedRun.id)
                await job?.remove()
            }
            catch (e) {
                log.error({ error: e, pausedRunId: pausedRun.id }, '[refillPausedRuns] Error removing job')
            }

            await jobQueue(log).add({
                id: pausedRun.id,
                type: JobType.ONE_TIME,
                data: {
                    projectId: pausedRun.projectId,
                    platformId: await projectService(log).getPlatformId(pausedRun.projectId),
                    environment: pausedRun.environment,
                    schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                    flowId: pausedRun.flowId,
                    flowVersionId: pausedRun.flowVersionId,
                    runId: pausedRun.id,
                    httpRequestId: waitpoint.httpRequestId ?? undefined,
                    synchronousHandlerId: waitpoint.workerHandlerId ?? null,
                    progressUpdateType: ProgressUpdateType.NONE,
                    jobType: WorkerJobType.EXECUTE_FLOW,
                    executionType: ExecutionType.RESUME,
                    payload: { type: 'inline' as const, value: {} },
                    logsUploadUrl,
                    logsFileId,
                },
                delay: calculateDelayForPausedRun(waitpoint.resumeDateTime),
            })
            migratedCount++
        }

        log.info({ count: migratedCount }, '[refillPausedRuns] Migrated paused runs')
        await redisConnection.set(REFILL_PAUSED_RUNS_KEY, 'true')
    },
})

function calculateDelayForPausedRun(resumeDateTimeIsoString: string): number {
    const delayInMilliSeconds = dayjs(resumeDateTimeIsoString).diff(dayjs())
    return delayInMilliSeconds < 0 ? 0 : delayInMilliSeconds
}
