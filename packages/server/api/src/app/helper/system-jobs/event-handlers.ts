import { isNil } from "@activepieces/shared"
import { systemJobQueueEvents, systemJobsQueue } from "./system-job"
import { DurableSystemJobName } from "./types/durable-jobs"
import { SystemJobData } from "./types"
import { flowService } from "../../flows/flow/flow.service"
import { FastifyBaseLogger } from "fastify"

export const systemJobEventHandler = (log: FastifyBaseLogger) => ({
    register() {
        systemJobQueueEvents.on('completed', async ({ jobId }) => {
            const job = await systemJobsQueue.getJob(jobId)
      
            if (isNil(job)) {
                return
            }

            if (job.name === DurableSystemJobName.DELETE_FLOW) {
                const jobData = job.data as SystemJobData<DurableSystemJobName.DELETE_FLOW>
                flowService(log).postDeleteFlow({
                    id: jobData.flowId,
                    projectId: jobData.projectId,
                    status: "success"
                })
            }
        })
        systemJobQueueEvents.on('failed', async ({ jobId, failedReason }) => {
            const job = await systemJobsQueue.getJob(jobId)
      
            if (isNil(job)) {
                return
            }

            if (job.name === DurableSystemJobName.DELETE_FLOW) {
                const jobData = job.data as SystemJobData<DurableSystemJobName.DELETE_FLOW>
                flowService(log).postDeleteFlow({
                    id: jobData.flowId,
                    projectId: jobData.projectId,
                    status: "failed",
                    failedReason
                })
            }
        })
    },
})
