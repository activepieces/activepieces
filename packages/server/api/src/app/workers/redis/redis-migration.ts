import { LATEST_JOB_DATA_SCHEMA_VERSION, QueueName, RepeatableJobType, ScheduledJobData } from '@activepieces/server-shared'
import { apId, ExecutionType, isNil, RunEnvironment, TriggerStrategy } from '@activepieces/shared'
import { Job, RepeatableJob } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { distributedLock } from '../../helper/lock'
import { triggerSourceRepo } from '../../trigger/trigger-source/trigger-source-service'
import { bullMqGroups } from './redis-queue'

export const redisMigrations = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const migrationLock = await distributedLock.acquireLock({
            key: 'jobs_lock',
            timeout: 30000,
            log,
        })
        try {
            const repeatableJobs = await getLegacyRepeatableJobs()
            if (repeatableJobs.length > 0) {
                await updateLegacyRepeatableJobKey(repeatableJobs, log)
            }
            const scheduledJobs = await getJobsToMigrate()
            if (scheduledJobs.length === 0) {
                return
            }
            log.info({
                count: scheduledJobs.length,
            }, 'migiration of scheduled jobs started')
            for (const job of scheduledJobs) {
                if (job) {
                    await migrateJob(job, log)
                }
            }
            log.info('migration of scheduled jobs completed')
        }
        finally {
            await migrationLock.release()
        }
    },
})

async function updateLegacyRepeatableJobKey(repeatableJobs: RepeatableJob[], log: FastifyBaseLogger) {
    log.info({
        jobs: repeatableJobs.length,
    }, '[#redisMigrations] found legacy repeatable jobs to update')

    const queue = bullMqGroups[QueueName.SCHEDULED]
    const client = await queue.client
    const currentJobs: Job[] = await queue.getJobs()

    let count = 0
    let broken = 0
    for (const repeatableJob of repeatableJobs) {
        const nextJob = currentJobs.find(job =>
            !isNil(job) &&
            job.repeatJobKey === repeatableJob.key &&
            !isNil(job.data),
        )

        const existingPattern = repeatableJob.pattern ?? nextJob?.opts?.repeat?.pattern
        const existingTimeZone = repeatableJob.tz ?? nextJob?.opts?.repeat?.tz
        const flowVersionId = nextJob?.data?.flowVersionId
        if (isNil(nextJob) || isNil(existingPattern) || isNil(flowVersionId)) {
            if (isNil(repeatableJob.name)) {
                log.info({
                    repeatableJob,
                }, '[#redisMigrations] remove broken job')
                broken++
                await queue.removeJobScheduler(repeatableJob.key)
            }
            continue
        }

        // Remove old scheduler and create new one with flowVersionId as key
        await queue.removeJobScheduler(repeatableJob.key)
        await queue.upsertJobScheduler(
            flowVersionId,
            {
                pattern: existingPattern,
                tz: existingTimeZone,
            },
            {
                name: flowVersionId,
                data: nextJob.data,
            },
        )

        // Clean up legacy key mapping
        await client.del(`activepieces:repeatJobKey:${flowVersionId}`)
        count++
    }
    log.info({
        jobs: count,
        brokenJobs: broken,
    }, '[#redisMigrations] legacy repeatable jobs migrated')
}

async function getLegacyRepeatableJobs() {
    const repeatableJobs = await bullMqGroups[QueueName.SCHEDULED].getJobSchedulers()
    /*
        BullMQ 5.0 introduced a new API for handling repeatable jobs. Previously, BullMQ would auto-generate keys
        which required maintaining a separate mapping between flowVersionId and repeatableJobKey. With this update,
        we can now directly use flowVersionId as the key, simplifying the mapping and maintenance.
    */
    return repeatableJobs.filter(job => !isNil(job) && job.key !== job.name)
}

async function getJobsToMigrate(): Promise<(Job<ScheduledJobData> | undefined)[]> {
    return (await bullMqGroups[QueueName.SCHEDULED].getJobs()).filter((job) => !isNil(job?.data) && job.data.schemaVersion !== LATEST_JOB_DATA_SCHEMA_VERSION)
}

async function migrateJob(job: Job<ScheduledJobData>, log: FastifyBaseLogger): Promise<void> {
    let modifiedJobData = JSON.parse(JSON.stringify(job.data))

    if (isNil(modifiedJobData.schemaVersion) || modifiedJobData.schemaVersion === 1) {
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
        await job.updateData(modifiedJobData)
    }

    if (modifiedJobData.schemaVersion === 2) {
        await updateCronExpressionOfRedisToPostgresTable(job, log)
        modifiedJobData.schemaVersion = 3
        await job.updateData(modifiedJobData)
    }

    if (modifiedJobData.schemaVersion === 3) {
        modifiedJobData.schemaVersion = 4
        if (modifiedJobData.executionType === ExecutionType.BEGIN) {
            modifiedJobData.jobType = RepeatableJobType.EXECUTE_TRIGGER
        }
        else if (modifiedJobData.executionType === ExecutionType.RESUME) {
            modifiedJobData.jobType = RepeatableJobType.DELAYED_FLOW
        }
        modifiedJobData.executionType = undefined
        await job.updateData(modifiedJobData)
    }
}

async function updateCronExpressionOfRedisToPostgresTable(job: Job, log: FastifyBaseLogger): Promise<void> {
    const { tz, pattern } = job.opts.repeat || {}
    if (isNil(tz) || isNil(pattern)) {
        log.error('Found unrepeatable job in repeatable queue')
        return
    }
    const flow = await flowRepo().findOneBy({
        publishedVersionId: job.data.flowVersionId,
    })
    if (isNil(flow) || isNil(flow.publishedVersionId)) {
        return
    }
    const flowVersion = await flowVersionService(log).getOneOrThrow(flow.publishedVersionId)
    await triggerSourceRepo().save({
        id: apId(),
        flowId: flow.id,
        flowVersionId: flow.publishedVersionId,
        projectId: flow.projectId,
        type: TriggerStrategy.POLLING,
        pieceName: flowVersion.trigger.settings.pieceName,
        pieceVersion: flowVersion.trigger.settings.pieceVersion,
        handshakeConfiguration: flowVersion.trigger.settings.handshakeConfiguration,
        schedule: {
            timezone: tz,
            cronExpression: pattern,
        },

    })
}
