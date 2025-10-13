import { FastifyBaseLogger } from "fastify"
import { redisConnections } from '../../../database/redis'
import { RedisType } from "../../../helper/system/system"
import { systemJobsQueue } from "../../../helper/system-jobs/system-job"

export const removeHardDeleteProjectJobs = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const redisType = redisConnections.getRedisType()
        if (redisType !== RedisType.MEMORY) {
            log.info('[removeHardDeleteProjectJobs] Skipping migration because they are migrated from persistent queue')
            return
        }
        const scheduledJobs = await systemJobsQueue.getJobs();
        const hardDeleteJobs = scheduledJobs.filter(job => (job.name as string) === 'hard-delete-project')

        for (const job of hardDeleteJobs) {
            await job.remove()
        }
        log.info('[removeHardDeleteProjectJobs] Removed all hard-delete-project jobs from the system job queue')
        return
    }
})
