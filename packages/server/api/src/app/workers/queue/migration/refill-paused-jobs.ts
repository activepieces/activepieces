import { AppSystemProp } from '@activepieces/server-shared'
import { apId, ExecutionType, FlowRunStatus, isNil, LATEST_JOB_DATA_SCHEMA_VERSION, PauseType, ProgressUpdateType, UploadLogsBehavior, WorkerJobType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { MoreThan } from 'typeorm'
import { redisConnections } from '../../../database/redis-connections'
import { flowRunRepo } from '../../../flows/flow-run/flow-run-service'
import { flowRunLogsService } from '../../../flows/flow-run/logs/flow-run-logs-service'
import { system } from '../../../helper/system/system'
import { projectService } from '../../../project/project-service'
import { jobQueue, workerJobsQueue } from '../job-queue'
import { JobType } from '../queue-manager'

const REFILL_PAUSED_RUNS_KEY = 'refill_paused_runs_v5'
const excutionRententionDays = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)

export const refillPausedRuns = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const redisConnection = await redisConnections.useExisting()
        const isMigrated = await redisConnection.get(REFILL_PAUSED_RUNS_KEY)
        if (!isNil(isMigrated)) {
            log.info('[refillPausedRuns] Already migrated, skipping')
            return
        }


        log.info('[refillPausedRuns] Finding paused runs to migrate')
        const pausedRuns = await flowRunRepo().find({
            where: {
                status: FlowRunStatus.PAUSED,
                created: MoreThan(dayjs().subtract(excutionRententionDays, 'day').toISOString()),
            },
        })
        log.info({
            count: pausedRuns.length,
        }, '[refillPausedRuns] Found paused runs to migrate')
        let migratedPausedRuns = 0

        const batchSize = 1000
        for (let i = 0; i < pausedRuns.length; i += batchSize) {
            const batch = pausedRuns.slice(i, i + batchSize)
            await Promise.all(batch.map(async (pausedRun) => {
                if (pausedRun.pauseMetadata?.type != PauseType.DELAY) {
                    return
                }
                const created = dayjs(pausedRun.created)
                if (created.isBefore(dayjs().subtract(excutionRententionDays, 'day'))) {
                    return
                }
                const logsFileId = pausedRun.logsFileId ?? apId()
                const logsUploadUrl = await flowRunLogsService(log).constructUploadUrl({
                    flowRunId: pausedRun.id,
                    logsFileId,
                    behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
                    projectId: pausedRun.projectId,
                })
                try {
                    const job = await workerJobsQueue?.getJob(pausedRun.id)
                    await job?.remove()
                }
                catch (e) {
                    log.error({
                        error: e,
                        pausedRunId: pausedRun.id,
                    }, '[refillPausedRuns] Error removing job')
                }
                await jobQueue(log).add({
                    id: pausedRun.id,
                    type: JobType.ONE_TIME,
                    data: {
                        projectId: pausedRun.projectId,
                        platformId: await projectService.getPlatformId(pausedRun.projectId),
                        environment: pausedRun.environment,
                        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                        flowId: pausedRun.flowId,
                        flowVersionId: pausedRun.flowVersionId,
                        runId: pausedRun.id,
                        httpRequestId: pausedRun.pauseMetadata?.requestIdToReply ?? undefined,
                        synchronousHandlerId: pausedRun.pauseMetadata.handlerId ?? null,
                        progressUpdateType: pausedRun.pauseMetadata.progressUpdateType ?? ProgressUpdateType.NONE,
                        jobType: WorkerJobType.EXECUTE_FLOW,
                        executionType: ExecutionType.RESUME,
                        payload: {},
                        logsUploadUrl,
                        logsFileId,
                    },
                    delay: calculateDelayForPausedRun(pausedRun.pauseMetadata.resumeDateTime),
                })
                migratedPausedRuns++
            }))
            if (migratedPausedRuns % 100 === 0) {
                log.info({
                    migratedPausedRuns,
                }, '[refillPausedRuns] Migrated paused runs')
            }
        }
        log.info({
            count: migratedPausedRuns,
        }, '[pausedRunsMigration] Migrated paused runs')
        await redisConnection.set(REFILL_PAUSED_RUNS_KEY, 'true')
    },
})

function calculateDelayForPausedRun(resumeDateTimeIsoString: string): number {
    const delayInMilliSeconds = dayjs(resumeDateTimeIsoString).diff(dayjs())
    return delayInMilliSeconds < 0 ? 0 : delayInMilliSeconds
}
