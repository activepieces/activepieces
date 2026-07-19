import { FlowTriggerType, LATEST_JOB_DATA_SCHEMA_VERSION, TriggerSourceScheduleType, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, MoreThan } from 'typeorm'
import { redisConnections } from '../../database/redis-connections'
import { projectService } from '../../project/project-service'
import { triggerSourceRepo } from '../../trigger/trigger-source/trigger-source-service'
import { jobQueue, JobType } from '../job-queue/job-queue'

const MIGRATION_KEY = 'every_x_minutes_interval_migration'
const BATCH_SIZE = 500

export const migrateEveryXMinutesToInterval = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const redisConnection = await redisConnections.useExisting()
        if (await redisConnection.get(MIGRATION_KEY)) {
            return
        }
        let migratedSchedulers = 0
        let lastId = ''

        for (;;) {
            const batch = await triggerSourceRepo().find({
                where: {
                    id: MoreThan(lastId),
                    deleted: IsNull(),
                    simulate: false,
                    pieceName: '@activepieces/piece-schedule',
                    triggerName: 'every_x_minutes',
                },
                order: { id: 'ASC' },
                take: BATCH_SIZE,
            })
            if (batch.length === 0) {
                break
            }
            lastId = batch[batch.length - 1].id
            await Promise.all(batch.map(async (triggerSource) => {
                const { schedule } = triggerSource
                if (!schedule || schedule.type !== TriggerSourceScheduleType.CRON_EXPRESSION) {
                    return
                }
                const minutes = parseEveryXMinutesCron(schedule.cronExpression)
                if (!minutes) {
                    log.warn({
                        trigger: { name: triggerSource.triggerName },
                        flowVersion: { id: triggerSource.flowVersionId },
                        cronExpression: schedule.cronExpression,
                    }, '[migrateEveryXMinutesToInterval] Unexpected cron expression, skipping')
                    return
                }
                const newSchedule = {
                    type: TriggerSourceScheduleType.INTERVAL as const,
                    intervalMs: minutes * 60_000,
                }
                await triggerSourceRepo().update(triggerSource.id, { schedule: newSchedule })
                await jobQueue(log).add({
                    id: triggerSource.flowVersionId,
                    type: JobType.REPEATING,
                    data: {
                        projectId: triggerSource.projectId,
                        platformId: await projectService(log).getPlatformId(triggerSource.projectId),
                        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                        flowVersionId: triggerSource.flowVersionId,
                        flowId: triggerSource.flowId,
                        triggerType: FlowTriggerType.PIECE,
                        jobType: WorkerJobType.EXECUTE_POLLING,
                    },
                    scheduleOptions: newSchedule,
                })
                migratedSchedulers++
            }))
        }

        await redisConnection.set(MIGRATION_KEY, '1')
        log.info({
            migratedSchedulers,
        }, '[migrateEveryXMinutesToInterval] Migrated every-x-minutes schedulers to interval')
    },
})

function parseEveryXMinutesCron(cronExpression: string): number | null {
    const match = /^\*\/(\d+) \* \* \* \*$/.exec(cronExpression)
    return match ? Number(match[1]) : null
}
