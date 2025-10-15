import { QueueName } from '@activepieces/server-shared'
import { ExecuteFlowJobData, isNil, WorkerJobType } from '@activepieces/shared'
import { Job, Queue } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { accessTokenManager } from '../../../authentication/lib/access-token-manager'
import { redisConnections } from '../../../database/redis'
import { flowVersionRepo } from '../../../flows/flow-version/flow-version.service'

const MIGRATION_KEY = 'migration:refill_jobs_with_engine_token'
const BATCH_SIZE = 1000

export const refillJobsWithEngineToken = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const redis = await redisConnections.useExisting()
        const alreadyMigrated = await redis.get(MIGRATION_KEY)
        if (!isNil(alreadyMigrated)) {
            log.info('[refillJobsWithEngineToken] Already migrated, skipping')
            return
        }

        const workerQueue = new Queue(QueueName.WORKER_JOBS, {
            connection: await redisConnections.createNew(),
        })

        let migratedJobs = 0
        for (let start = 0; ; start += BATCH_SIZE) {
            const jobs = await workerQueue.getJobs(undefined, start, start + BATCH_SIZE)
            if (!jobs?.length) break

            // Only jobs lacking 'engineToken'
            const jobsToMigrate = jobs.filter(job => !('engineToken' in job.data))
            if (!jobsToMigrate.length) continue

            // Map flowVersionId to flowId for EXECUTE_FLOW jobs
            const flowVersionIdToFlowId: Record<string, string> = {}
            const flowJobs = jobsToMigrate.filter(
                job => job.data.jobType === WorkerJobType.EXECUTE_FLOW,
            ) as Job<ExecuteFlowJobData>[]

            if (flowJobs.length) {
                const flowVersions = await flowVersionRepo().find({
                    where: { id: In(flowJobs.map(job => job.data.flowVersionId)) },
                    select: { id: true, flowId: true },
                })
                for (const { id, flowId } of flowVersions) {
                    flowVersionIdToFlowId[id] = flowId
                }
            }

            await Promise.all(
                jobsToMigrate.map(async job => {
                    const engineToken = await accessTokenManager.generateEngineToken({
                        jobId: job.id,
                        projectId: job.data.projectId!,
                        platformId: job.data.platformId,
                    })
                    const updatedData = {
                        ...job.data,
                        engineToken,
                    }
                    if (job.data.jobType === WorkerJobType.EXECUTE_FLOW) {
                        updatedData.flowId = flowVersionIdToFlowId[job.data.flowVersionId]
                    }
                    return job.updateData(updatedData)
                }),
            )

            migratedJobs += jobsToMigrate.length
        }

        log.info({
          migratedJobs,
        }, '[refillJobsWithEngineToken] Refilled jobs with engine token and flowId')

        await workerQueue.close()
        // Mark as migrated if all jobs are up-to-date
        if (migratedJobs === 0) {
            await redis.set(MIGRATION_KEY, 'true')
        }
    },
})
