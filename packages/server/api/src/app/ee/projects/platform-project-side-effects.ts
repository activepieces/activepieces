import { ProjectId } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobName } from '../../helper/system-jobs/common'

export const platformProjectSideEffects = (log: FastifyBaseLogger) => ({
    async onSoftDelete({ id }: OnSoftDeleteParams): Promise<void> {
        await systemJobsSchedule(log).upsertJob({
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
})

type OnSoftDeleteParams = {
    id: ProjectId
}
