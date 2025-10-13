import { ProjectId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformProjectService } from '../../../ee/projects/platform-project-service'
import { systemJobsQueue } from '../../../helper/system-jobs/system-job'

export const removeHardDeleteProjectJobs = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const scheduledJobs = await systemJobsQueue.getJobs()
        const hardDeleteJobs = scheduledJobs.filter(
            (job) => (job.name as string) === 'hard-delete-project',
        )

        await Promise.all(
            hardDeleteJobs.map(async (job) => {
                await job.remove()
                const projectId = (job.data as any).projectId as ProjectId
                if (projectId)
                    await platformProjectService(log).hardDelete({ id: projectId })
            }),
        )
        log.info(
            '[removeHardDeleteProjectJobs] Removed all hard-delete-project jobs from the system job queue',
        )
        return
    },
})
