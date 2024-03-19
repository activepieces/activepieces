import dayjs from 'dayjs'
import { ProjectId } from '@activepieces/shared'
import { logger } from 'server-shared'
import { platformProjectService } from './platform-project-service'
import { SystemJob, redisSystemJob } from '../helper/redis-system-job'

export const platformProjectSideEffects = {
    async onSoftDelete({ id }: OnSoftDeleteParams): Promise<void> {
        await redisSystemJob.upsertJob({
            job: {
                name: 'hard-delete-project',
                data: {
                    projectId: id,
                },
            },
            schedule: {
                type: 'one-time',
                date: dayjs().add(30, 'days'),
            },
            handler: hardDeleteProjectJobHandler,
        })
    },
}

const hardDeleteProjectJobHandler = async (job: SystemJob<'hard-delete-project'>): Promise<void> => {
    logger.info({ name: 'PlatformProjectSideEffects#hardDeleteProjectJobHandler', projectId: job.data.projectId })

    const { projectId } = job.data
    await platformProjectService.hardDelete({ id: projectId })
}

type OnSoftDeleteParams = {
    id: ProjectId
}
