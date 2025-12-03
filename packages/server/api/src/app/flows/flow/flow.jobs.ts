import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, FlowOperationStatus, FlowStatusUpdatedResponse, isNil, tryCatch, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { websocketService } from '../../core/websockets.service'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
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
        await flowExecutionCache(log).invalidate(flow.id)
    },

    updateStatusHandler: async (data: SystemJobData<SystemJobName.UPDATE_FLOW_STATUS>) => {
        const { id, projectId, newStatus, preUpdateDone } = data
        const job = await systemJobsSchedule(log).getJob(`update-flow-status-${id}`)
        assertNotNullOrUndefined(job, 'job')

        const { error } = await tryCatch<unknown, ActivepiecesError>(async () => {
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

                await flowRepo().save({
                    ...flowToUpdate,
                    status: newStatus,
                    operationStatus: FlowOperationStatus.NONE,
                    publishedVersionId: publishedFlowVersion.id,
                })
                await flowExecutionCache(log).invalidate(id)

            }
        })


        if (error) {
            await flowRepo().update(id, {
                operationStatus: FlowOperationStatus.NONE,
            })
        }

        const flow = await flowService(log).getOnePopulatedOrThrow({
            id,
            projectId,
        })
        const response: FlowStatusUpdatedResponse = {
            flow,
            error: isNil(error) || error?.error.code !== ErrorCode.TRIGGER_UPDATE_STATUS ? undefined : error?.error,
        }
        websocketService.to(projectId).emit(WebsocketClientEvent.FLOW_STATUS_UPDATED, response)

        if (!isNil(error)) {
            throw error
        }

    },
})