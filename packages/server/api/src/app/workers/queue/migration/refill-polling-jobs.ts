import { FlowTriggerType, LATEST_JOB_DATA_SCHEMA_VERSION, TriggerSourceScheduleType, TriggerStrategy, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull } from 'typeorm'
import { jobQueue } from '..'
import { projectService } from '../../../project/project-service'
import { triggerSourceRepo } from '../../../trigger/trigger-source/trigger-source-service'
import { JobType } from '../queue-manager'

export const refillPollingJobs = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const triggerSources = await triggerSourceRepo().find({
            where: {
                deleted: IsNull(),
                simulate: false,
                type: TriggerStrategy.POLLING,
            },
        })
        let migratedPollingJobs = 0

        const batchSize = 100
        for (let i = 0; i < triggerSources.length; i += batchSize) {
            const batch = triggerSources.slice(i, i + batchSize)
            await Promise.all(batch.map(async (triggerSource) => {
                if (!triggerSource.schedule) {
                    return
                }
                await jobQueue(log).add({
                    id: triggerSource.flowVersionId,
                    type: JobType.REPEATING,
                    data: {
                        projectId: triggerSource.projectId,
                        platformId: await projectService.getPlatformId(triggerSource.projectId),
                        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                        flowVersionId: triggerSource.flowVersionId,
                        flowId: triggerSource.flowId,
                        triggerType: FlowTriggerType.PIECE,
                        jobType: WorkerJobType.EXECUTE_POLLING,
                    },
                    scheduleOptions: {
                        type: TriggerSourceScheduleType.CRON_EXPRESSION,
                        cronExpression: triggerSource.schedule.cronExpression,
                        timezone: triggerSource.schedule.timezone,
                    },
                })
                migratedPollingJobs++
            }))
        }

        log.info({
            migratedPollingJobs,
        }, '[pollingJobsMigration] Migrated polling jobs')
    },
})
