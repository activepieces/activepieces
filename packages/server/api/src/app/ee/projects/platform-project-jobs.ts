import { assertNotNullOrUndefined } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { flowSideEffects } from '../../flows/flow/flow-service-side-effects'
import { flowRepo } from '../../flows/flow/flow.repo'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { hardDeleteProject } from './platform-project-service'

export const platformProjectBackgroundJobs = (log: FastifyBaseLogger) => ({
    hardDeleteProjectHandler: async (data: SystemJobData<SystemJobName.HARD_DELETE_PROJECT>) => {
        const { projectId, platformId, preDeletedFlowIds } = data
        const job = await systemJobsSchedule(log).getJob(`hard-delete-project-${projectId}`)
        assertNotNullOrUndefined(job, 'job is required')

        const allFlows = await flowRepo().find({ where: { projectId } })
        const processedFlowIds = [...preDeletedFlowIds]

        for (const flow of allFlows) {
            if (processedFlowIds.includes(flow.id)) {
                continue
            }
            const flowExists = await flowRepo().existsBy({ id: flow.id })
            if (!flowExists) {
                log.info({ flow: { id: flow.id } }, '[hardDeleteProjectHandler] Flow already deleted, skipping preDelete')
                continue
            }
            await flowSideEffects(log).preDelete({ flowToDelete: flow })
            processedFlowIds.push(flow.id)
            await job.updateData({ ...data, preDeletedFlowIds: processedFlowIds })
        }

        await hardDeleteProject({ projectId, platformId, log, skipFlowIds: processedFlowIds })
    },
})
