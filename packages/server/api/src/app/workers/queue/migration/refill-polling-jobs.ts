import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import { FlowTriggerType, isNil, LATEST_JOB_DATA_SCHEMA_VERSION, TriggerSourceScheduleType, TriggerStrategy, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull } from 'typeorm'
import { jobQueue } from '..'
import { flowVersionService } from '../../../flows/flow-version/flow-version.service'
import { pieceMetadataService } from '../../../pieces/piece-metadata-service'
import { projectService } from '../../../project/project-service'
import { triggerSourceRepo } from '../../../trigger/trigger-source/trigger-source-service'
import { JobType } from '../queue-manager'

export const refillPollingJobs = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const triggerSources = await triggerSourceRepo().find({
            where: {
                deleted: IsNull(),
                simulate: false,
            },
        })
        for (const triggerSource of triggerSources) {
            if (!triggerSource.schedule) {
                continue
            }
            switch (triggerSource.type) {
                case TriggerStrategy.WEBHOOK: {
                    const pieceMetadata = await pieceMetadataService(log).get({
                        name: triggerSource.pieceName,
                        version: triggerSource.pieceVersion,
                        projectId: triggerSource.projectId,
                        platformId: await projectService.getPlatformId(triggerSource.projectId),
                    })
                    const flowVersion = await flowVersionService(log).getOne(triggerSource.flowVersionId)
                    if (isNil(flowVersion)) {
                        continue
                    }
                    const pieceTrigger = pieceMetadata?.triggers?.[flowVersion?.trigger.settings.triggerName]
                    if (isNil(pieceTrigger)
                        || isNil(pieceTrigger.renewConfiguration)
                        || pieceTrigger.renewConfiguration.strategy !== WebhookRenewStrategy.CRON) {
                        continue
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
                    continue
                }
                case TriggerStrategy.POLLING: {
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
                    break
                }
                case TriggerStrategy.APP_WEBHOOK: {
                    break
                }
            }
        }
        log.info({
            count: triggerSources.length,
        }, '[pollingJobsMigration] Migrated polling jobs')
    },
})

