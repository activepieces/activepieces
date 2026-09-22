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
const TOMBSTONE_REAP_LIMIT = 50

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

    reapTombstonedFlows: async () => {
        const tombstoned = await flowRepo().find({
            where: { operationStatus: FlowOperationStatus.DELETING },
            order: { updated: 'ASC' },
            take: TOMBSTONE_REAP_LIMIT,
        })
        if (tombstoned.length === 0) {
            return
        }
        log.warn({ flowCount: tombstoned.length }, '[reapTombstonedFlows] Re-queueing deletions that never finished')
        await Promise.all(tombstoned.map((flow) => flowService(log).addDeleteFlowJob(flow)))
    },

})
