import { AppConnectionScope, assertNotNullOrUndefined } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ArrayContains } from 'typeorm'
import { appConnectionsRepo } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowSideEffects } from '../../flows/flow/flow-service-side-effects'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { ProjectEntity } from '../../project/project-entity'

const projectRepo = repoFactory(ProjectEntity)

export const platformProjectBackgroundJobs = (log: FastifyBaseLogger) => ({
    hardDeleteProjectHandler: async (data: SystemJobData<SystemJobName.HARD_DELETE_PROJECT>) => {
        const { projectId, platformId, cleanedUpFlowIds } = data
        const job = await systemJobsSchedule(log).getJob(`hard-delete-project-${projectId}`)
        assertNotNullOrUndefined(job, 'job is required')

        const allFlows = await flowRepo().find({
            where: { projectId },
        })

        for (const flow of allFlows) {
            if (cleanedUpFlowIds.includes(flow.id)) {
                continue
            }
            await flowSideEffects(log).preDelete({ flowToDelete: flow })
            await job.updateData({
                ...data,
                cleanedUpFlowIds: [...cleanedUpFlowIds, flow.id],
            })
        }

        await transaction(async (entityManager) => {
            await appConnectionsRepo(entityManager).delete({
                scope: AppConnectionScope.PROJECT,
                projectIds: ArrayContains([projectId]),
            })
            await projectRepo(entityManager).delete({
                id: projectId,
                platformId,
            })
        })
    },
})
