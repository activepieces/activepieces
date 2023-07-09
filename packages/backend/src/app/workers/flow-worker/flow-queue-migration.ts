import { isNil } from '@activepieces/shared'
import { flowInstanceRepo } from '../../flows/flow-instance/flow-instance.service'
import { ExecutionType, RunEnvironment, ScheduleType } from '@activepieces/shared'
import { logger } from '../../helper/logger'
import { scheduledJobQueue } from './flow-queue'
import { LATEST_JOB_DATA_SCHEMA_VERSION } from './job-data'
import { Job } from 'bullmq'
import { acquireLock } from '../../database/redis-connection'

export const migrateScheduledJobs = async (): Promise<void> => {
    const migrationLock = await acquireLock({
        key: 'jobs_lock',
        timeout: 30000,
    })
    try {
        logger.info('[migrateScheduledJobs] Starting migration')
        let migratedJobs = 0
        const scheduledJobs = await scheduledJobQueue.getJobs()
        logger.info(`[migrateScheduledJobs] Found  ${scheduledJobs.length} total jobs`)
        const jobsToMigrate = scheduledJobs.filter((job) => job.data.schemaVersion !== LATEST_JOB_DATA_SCHEMA_VERSION)
        for (const job of jobsToMigrate) {
            // Cast as we are not sure about the schema
            let modifiedJobData = JSON.parse(JSON.stringify(job.data))
            if (modifiedJobData.schemaVersion === undefined || modifiedJobData.schemaVersion === 1) {
                const { flowVersion, projectId, triggerType } = modifiedJobData
                modifiedJobData = {
                    schemaVersion: 2,
                    flowVersionId: flowVersion.id,
                    flowId: flowVersion.flowId,
                    projectId,
                    environment: RunEnvironment.PRODUCTION,
                    executionType: ExecutionType.BEGIN,
                    triggerType,
                }
                migratedJobs++
                await job.update(modifiedJobData)
            }
            if (modifiedJobData.schemaVersion === 2) {
                const updated = await updateCronExpressionOfRedisToPostgresTable(job)
                if (updated) {
                    modifiedJobData.schemaVersion = 3
                    migratedJobs++
                    await job.update(modifiedJobData)
                }
            }
        }
        logger.info(`[migrateScheduledJobs] Migrated ${migratedJobs} jobs`)
    }
    finally {
        await migrationLock.release()
    }
}

async function updateCronExpressionOfRedisToPostgresTable(job: Job): Promise<boolean> {
    const tz = job.opts.repeat?.tz
    const pattern = job.opts.repeat?.pattern
    if (isNil(tz) || isNil(pattern)) {
        logger.error('Found unrepeatable job in repeatable queue')
        return false
    }
    const flowInstance = await flowInstanceRepo.findOneBy({
        flowVersionId: job.data.flowVersionId,
    })
    if (!isNil(flowInstance)) {
        await flowInstanceRepo.update(flowInstance.id, {
            ...flowInstance,
            schedule: {
                type: ScheduleType.CRON_EXPRESSION,
                timezone: tz,
                cronExpression: pattern,
            },
        })
        return true
    }
    return false
}