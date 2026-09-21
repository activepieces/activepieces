import { assertNotNullOrUndefined } from '@activepieces/core-utils'
import { FlowOperationStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { WaitpointEntity } from '../../waitpoints/waitpoint-entity'
import { flowRunRepo } from '../flow-run/flow-run-service'
import { flowVersionRepo } from '../flow-version/flow-version.service'
import { flowExecutionCache } from './flow-execution-cache'
import { flowSideEffects } from './flow-service-side-effects'
import { flowRepo } from './flow.repo'
import { flowService } from './flow.service'

const waitpointRepo = repoFactory(WaitpointEntity)

const BATCH_SIZE = 1000
const STRANDED_DELETION_AGE_MINUTES = 15
const STRANDED_DELETION_BATCH_SIZE = 100

export async function batchDeleteByFlowId(flowId: string): Promise<void> {
    while (true) {
        const runs = await flowRunRepo().find({
            select: { id: true },
            where: { flowId },
            take: BATCH_SIZE,
        })
        if (runs.length === 0) break
        const ids = runs.map(r => r.id)
        await waitpointRepo()
            .createQueryBuilder()
            .delete()
            .where('"flowRunId" IN (:...ids)', { ids })
            .execute()
        await flowRunRepo()
            .createQueryBuilder()
            .delete()
            .where('id IN (:...ids)', { ids })
            .execute()
    }

    await flowRepo().update({ id: flowId }, { publishedVersionId: null })

    let deleted: number
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
            log.info({ flow: { id: flow.id } }, '[deleteFlowHandler] Flow already deleted, skipping')
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

    strandedDeletionSweepHandler: async () => {
        const strandedFlows = await flowRepo()
            .createQueryBuilder('flow')
            .where('flow."operationStatus" = :deleting', { deleting: FlowOperationStatus.DELETING })
            .andWhere('flow.updated < NOW() - make_interval(mins => :mins)', { mins: STRANDED_DELETION_AGE_MINUTES })
            .orderBy('flow.updated', 'ASC')
            .take(STRANDED_DELETION_BATCH_SIZE)
            .getMany()
        if (strandedFlows.length > 0) {
            log.warn({ flowCount: strandedFlows.length }, '[strandedDeletionSweepHandler] Re-enqueueing stranded flow deletions')
        }
        await Promise.all(strandedFlows.map((flow) => flowService(log).addDeleteFlowJob(flow)))
    },

})
