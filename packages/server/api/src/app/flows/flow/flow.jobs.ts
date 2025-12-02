import { assertNotNullOrUndefined, FlowOperationStatus, tryCatch, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { websocketService } from '../../core/websockets.service'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { flowVersionService } from '../flow-version/flow-version.service'
import { flowExecutionCache } from './flow-execution-cache'
import { flowSideEffects } from './flow-service-side-effects'
import { flowRepo } from './flow.repo'
import { flowService } from './flow.service'

export const flowBackgroundJobs = (log: FastifyBaseLogger) => ({

    deleteHandler: async (data: SystemJobData<SystemJobName.DELETE_FLOW>) => {
        const { flow, preDeleteDone, dbDeleteDone } = data
        const job = await systemJobsSchedule(log).getJob(`delete-flow-${flow.id}`)
        assertNotNullOrUndefined(job, 'job is required')
        if (!preDeleteDone) {
            await flowSideEffects(log).preDelete({
                flowToDelete: flow,
            })
            await job.updateData({
                ...data,
                preDeleteDone: true,
            })
        }
        if (!dbDeleteDone) {
            await flowRepo().delete({ id: flow.id })
            await job.updateData({
                ...data,
                preDeleteDone: true,
                dbDeleteDone: true,
            })
        }
        await flowExecutionCache(log).delete(flow.id)
    },

    updateStatusHandler: async (data: SystemJobData<SystemJobName.UPDATE_FLOW_STATUS>) => {
        const { id, projectId, newStatus, preUpdateDone } = data
        const job = await systemJobsSchedule(log).getJob(`update-flow-status-${id}`)
        assertNotNullOrUndefined(job, 'job')

        const { error } = await tryCatch(async () => {
            const flowToUpdate = await flowService(log).getOneOrThrow({
                id,
                projectId,
            })
        
            const publishedFlowVersionId = flowToUpdate.publishedVersionId
            if (flowToUpdate.status !== newStatus) {
                assertNotNullOrUndefined(publishedFlowVersionId, 'publishedFlowVersionId is required')
                const publishedFlowVersion = await flowVersionService(log).getFlowVersionOrThrow({
                    flowId: flowToUpdate.id,
                    versionId: publishedFlowVersionId,
                })

                if (!preUpdateDone) {
                    await flowSideEffects(log).preUpdateStatus({
                        flowToUpdate,
                        publishedFlowVersion,
                        newStatus,
                    })
                    await job.updateData({
                        ...data,
                        preUpdateDone: true,
                    })
                }
        
                flowToUpdate.status = newStatus
                flowToUpdate.operationStatus = FlowOperationStatus.NONE
                await flowRepo().save(flowToUpdate)
                await flowExecutionCache(log).delete(id)
                websocketService.to(projectId).emit(WebsocketClientEvent.FLOW_STATUS_UPDATED, { flow: flowToUpdate, status: 'success' })
            }
        })

        if (error) {
            if (job.attemptsStarted >= (job.opts.attempts ?? 0)) {
                await flowRepo().update(id, {
                    operationStatus: FlowOperationStatus.NONE,
                })
                const flowTrigger = await triggerSourceService(log).getByFlowId({
                    flowId: id,
                    projectId,
                    simulate: false,
                })
                websocketService.to(projectId).emit(WebsocketClientEvent.FLOW_STATUS_UPDATED, { status: 'failed', error, flowTrigger })
            }
            throw error
        }
    },
})