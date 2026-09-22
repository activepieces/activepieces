import { assertNotNullOrUndefined, tryCatch } from '@activepieces/core-utils'
import { Flow, FlowOperationStatus } from '@activepieces/shared'
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

const waitpointRepo = repoFactory(WaitpointEntity)

const BATCH_SIZE = 1000
const TOMBSTONE_AGE_MINUTES = 60
const TOMBSTONE_REAP_LIMIT = 5

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
        await removeFlowAndItsData({ flow, log })
    },

    reapTombstonedFlows: async () => {
        const tombstoned = await flowRepo()
            .createQueryBuilder('flow')
            .where('flow."operationStatus" = :deleting', { deleting: FlowOperationStatus.DELETING })
            .andWhere('flow.updated < NOW() - make_interval(mins => :mins)', { mins: TOMBSTONE_AGE_MINUTES })
            .take(TOMBSTONE_REAP_LIMIT)
            .getMany()
        if (tombstoned.length === 0) {
            return
        }
        log.warn({ flowCount: tombstoned.length }, '[reapTombstonedFlows] Reclaiming flows whose deletion never finished')
        for (const flow of tombstoned) {
            const { error } = await tryCatch(async () => {
                await flowSideEffects(log).preDelete({ flowToDelete: flow })
                await removeFlowAndItsData({ flow, log })
            })
            if (error !== null) {
                log.error({ error, flow: { id: flow.id } }, '[reapTombstonedFlows] Could not reclaim flow')
            }
        }
    },

})

const removeFlowAndItsData = async ({ flow, log }: { flow: Flow, log: FastifyBaseLogger }): Promise<void> => {
    await batchDeleteByFlowId(flow.id)
    await flowRepo().delete({ id: flow.id })
    await flowExecutionCache(log).invalidate(flow.id)
}
