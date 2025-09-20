import { AppSystemProp } from '@activepieces/server-shared'
import { FlowRunStatus, LATEST_JOB_DATA_SCHEMA_VERSION, PauseType, ProgressUpdateType, WorkerJobType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { jobQueue } from '../job-queue'
import { flowRunRepo } from '../../../flows/flow-run/flow-run-service'
import { QueueMode, system } from '../../../helper/system/system'
import { projectService } from '../../../project/project-service'
import { JobType } from '../queue-manager'

const queueMode = system.getOrThrow(AppSystemProp.QUEUE_MODE)


export const refillPausedRuns = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        if (queueMode === QueueMode.REDIS) {
            log.info('[pausedRunsMigration] Skipping migration because they are migrated from legacy queue')
            return
        }
        
        const pausedRuns = await flowRunRepo().find({
            where: {
                status: FlowRunStatus.PAUSED,
            },
        })
        for (const pausedRun of pausedRuns) {
            if (pausedRun.pauseMetadata?.type != PauseType.DELAY) {
                continue
            }
            await jobQueue(log).add({
                id: 'delayed_' + pausedRun.id,
                type: JobType.ONE_TIME,
                data: {
                    projectId: pausedRun.projectId,
                    platformId: await projectService.getPlatformId(pausedRun.projectId),
                    environment: pausedRun.environment,
                    schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                    flowVersionId: pausedRun.flowVersionId,
                    flowId: pausedRun.flowId,
                    runId: pausedRun.id,
                    httpRequestId: pausedRun.pauseMetadata?.requestIdToReply ?? undefined,
                    synchronousHandlerId: pausedRun.pauseMetadata.handlerId ?? null,
                    progressUpdateType: pausedRun.pauseMetadata.progressUpdateType ?? ProgressUpdateType.NONE,
                    jobType: WorkerJobType.DELAYED_FLOW,
                },
                delay: calculateDelayForPausedRun(pausedRun.pauseMetadata.resumeDateTime),
            })
        }
        log.info({
            count: pausedRuns.length,
        }, '[pausedRunsMigration] Migrated paused runs')
    },
})

function calculateDelayForPausedRun(resumeDateTimeIsoString: string): number {
    const delayInMilliSeconds = dayjs(resumeDateTimeIsoString).diff(dayjs())
    return delayInMilliSeconds < 0 ? 0 : delayInMilliSeconds
}
