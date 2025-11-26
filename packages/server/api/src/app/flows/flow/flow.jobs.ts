import { FastifyBaseLogger } from "fastify";
import { SystemJobData, SystemJobName } from "../../helper/system-jobs/common";
import { systemJobsSchedule } from "../../helper/system-jobs/system-job";
import { assertNotNullOrUndefined, Flow, FlowOperationStatus, WebsocketClientEvent, tryCatch } from "@activepieces/shared";
import { flowSideEffects } from "./flow-service-side-effects";
import { flowRepo } from "./flow.repo";
import { flowExecutionCache } from "./flow-execution-cache";
import { flowService } from "./flow.service";
import { flowVersionService } from "../flow-version/flow-version.service";
import { apDayjs } from "@activepieces/server-shared";
import { websocketService } from "../../core/websockets.service";

export const flowBackgroundJobs = (log: FastifyBaseLogger) => ({

    addDeleteJob: async (flow: Flow) => {
        await systemJobsSchedule(log).upsertJob({
            job: {
                name: SystemJobName.DELETE_FLOW,
                data: {
                    flow,
                    preDeleteDone: false,
                    dbDeleteDone: false,
                },
                jobId: `delete-flow-${flow.id}`,
            },
            schedule: {
                type: 'one-time',
                date: apDayjs().add(1, 'second'),
            },
        })
    },

    addUpdateStatusJob: async (data: Omit<SystemJobData<SystemJobName.UPDATE_FLOW_STATUS>, 'preUpdateDone'>) => {
      await systemJobsSchedule(log).upsertJob({
          job: {
              name: SystemJobName.UPDATE_FLOW_STATUS,
              data: {
                ...data,
                preUpdateDone: false,
              },
              jobId: `update-flow-status-${data.id}`,
          },
          schedule: {
              type: 'one-time',
              date: apDayjs().add(1, 'second'),
          },
      })
  },

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
                await websocketService.to(projectId).emit(WebsocketClientEvent.FLOW_STATUS_UPDATED, { flow: flowToUpdate, status: "success" })
            }
        })

        if (error) {
            if (job.attemptsMade >= (job.opts.attempts ?? 0)){
                await flowRepo().update(id, {
                    operationStatus: FlowOperationStatus.NONE,
                })
                await websocketService.to(projectId).emit(WebsocketClientEvent.FLOW_STATUS_UPDATED, { status: "failed", error: error.message })
            }
            throw error
        }
    },
})