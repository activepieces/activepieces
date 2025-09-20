import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import { isNil, LATEST_JOB_DATA_SCHEMA_VERSION, TriggerSourceScheduleType, TriggerStrategy, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull } from 'typeorm'
import { pieceMetadataService } from '../../../pieces/piece-metadata-service'
import { projectService } from '../../../project/project-service'
import { triggerSourceRepo } from '../../../trigger/trigger-source/trigger-source-service'
import { JobType } from '../queue-manager'
import { jobQueue } from '../job-queue'

export const refillRenewWebhookJobs = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const triggerSources = await triggerSourceRepo().find({
            where: {
                deleted: IsNull(),
                simulate: false,
                type: TriggerStrategy.WEBHOOK,
            },
        })
        let migratedRenewWebhookJobs = 0

        const batchSize = 100
        for (let i = 0; i < triggerSources.length; i += batchSize) {
            const batch = triggerSources.slice(i, i + batchSize)
            await Promise.all(batch.map(async (triggerSource) => {
                const pieceMetadata = await pieceMetadataService(log).get({
                    name: triggerSource.pieceName,
                    version: triggerSource.pieceVersion,
                    projectId: triggerSource.projectId,
                    platformId: await projectService.getPlatformId(triggerSource.projectId),
                })
                const pieceTrigger = pieceMetadata?.triggers?.[triggerSource.triggerName]
                if (isNil(pieceTrigger) || isNil(pieceTrigger.renewConfiguration) || pieceTrigger.renewConfiguration.strategy !== WebhookRenewStrategy.CRON) {
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
                        jobType: WorkerJobType.RENEW_WEBHOOK,
                    },
                    scheduleOptions: {
                        type: TriggerSourceScheduleType.CRON_EXPRESSION,
                        cronExpression: pieceTrigger.renewConfiguration.cronExpression,
                        timezone: 'UTC',
                    },
                })
                migratedRenewWebhookJobs++
            }))
        }

        log.info({
            migratedRenewWebhookJobs,
        }, '[renewWebhookJobsMigration] Migrated renew webhook jobs')
    },
})