import { logger } from '@activepieces/server-shared'
import { ProjectId } from '@activepieces/shared'
import dayjs from 'dayjs'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { registerJobHandler } from '../../helper/system-jobs/job-handlers'
import { platformProjectService } from './platform-project-service'

export const platformProjectSideEffects = {
    async onSoftDelete({ id }: OnSoftDeleteParams): Promise<void> {
        await systemJobsSchedule.upsertJob({
            job: {
                name: SystemJobName.HARD_DELETE_PROJECT,
                data: {
                    projectId: id,
                },
            },
            schedule: {
                type: 'one-time',
                date: dayjs().add(30, 'days'),
            },
        })
    },
}

const hardDeleteProjectJobHandler = async (job: SystemJobData<{ projectId: string }>): Promise<void> => {
    logger.info({ name: 'PlatformProjectSideEffects#hardDeleteProjectJobHandler', projectId: job.projectId })
    await platformProjectService.hardDelete({ id: job.projectId })
}

registerJobHandler(SystemJobName.HARD_DELETE_PROJECT, hardDeleteProjectJobHandler)

type OnSoftDeleteParams = {
    id: ProjectId
}
