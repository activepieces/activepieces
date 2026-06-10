import { assertNotNullOrUndefined } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { flowRunRepo } from '../flow-run/flow-run-service'
import { WaitpointEntity } from '../flow-run/waitpoint/waitpoint-entity'
import { flowVersionRepo } from '../flow-version/flow-version.service'
import { flowExecutionCache } from './flow-execution-cache'
import { flowSideEffects } from './flow-service-side-effects'
import { flowRepo } from './flow.repo'

const waitpointRepo = repoFactory(WaitpointEntity)

const BATCH_SIZE = 1000

export async function batchDeleteByFlowId(flowId: string): Promise<void> {
    await waitpointRepo()
        .createQueryBuilder()
        .delete()
        .where('"flowRunId" IN (SELECT id FROM flow_run WHERE "flowId" = :flowId)', { flowId })
        .execute()

    let deleted: number
    do {
        const result = await flowRunRepo()
            .createQueryBuilder()
            .delete()
            .where('id IN (SELECT id FROM flow_run WHERE "flowId" = :flowId LIMIT :limit)', { flowId, limit: BATCH_SIZE })
            .execute()
        deleted = result.affected ?? 0
    } while (deleted > 0)

    await flowRepo().update({ id: flowId }, { publishedVersionId: null })

    do {
        const result = await flowVersionRepo()
            .createQueryBuilder()
            .delete()
            .where('id IN (SELECT id FROM flow_version WHERE "flowId" = :flowId LIMIT :limit)', { flowId, limit: BATCH_SIZE })
            .execute()
        deleted = result.affected ?? 0
    } while (deleted > 0)
}

export const flowBackgroundJobs = (log: FastifyBaseLogger) => ({

    deleteFlowHandler: async (data: SystemJobData<SystemJobName.DELETE_FLOW>) => {
        const { flow, preDeleteDone } = data
        const job = await systemJobsSchedule(log).getJob(`delete-flow-${flow.id}`)
        assertNotNullOrUndefined(job, 'job is required')

        const flowExists = await flowRepo().existsBy({ id: flow.id })
        if (!flowExists) {
            log.info({ flowId: flow.id }, '[deleteFlowHandler] Flow already deleted, skipping')
            return
        }

        if (!preDeleteDone) {
            await flowSideEffects(log).preDelete({
                flowToDelete: flow,
            })
            await job.updateData({
                ...data,
                preDeleteDone: true,
            })
        }
        await batchDeleteByFlowId(flow.id)
        await flowRepo().delete({ id: flow.id })
        await flowExecutionCache(log).invalidate(flow.id)
    },

})