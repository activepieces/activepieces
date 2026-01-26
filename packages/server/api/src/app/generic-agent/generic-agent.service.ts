import { apId, ExecuteAgentJobData, ExecuteAgentRequest, PlatformId, WorkerJobType } from "@activepieces/shared"
import { FastifyBaseLogger, FastifyReply } from "fastify"
import { jobQueue } from "../workers/queue/job-queue"
import { JobType } from "../workers/queue/queue-manager"
import { pubsubFactory } from "@activepieces/server-shared"
import { pubsub } from "../helper/pubsub"

export const genericAgentService = (log: FastifyBaseLogger) => ({
    async executeAgent(params: ExecuteAgentRequest & { platformId: PlatformId} ): Promise<string> {
        const requestId = apId()
        const jobData: ExecuteAgentJobData = {
            platformId: params.platformId,
            projectId: params.projectId,
            session: {
                prompt: params.prompt,
                tools: params.tools,
                modelId: params.modelId,
                state: params.state,
                conversation: params.conversation ?? [],
                requestId,
            },
            jobType: WorkerJobType.EXECUTE_AGENT,
        }
        await jobQueue(log).add({
            id: apId(),
            type: JobType.ONE_TIME,
            data: jobData,
        })
        return requestId
    },
    async streamAgentResponse(params: StreamAgentResponseRequest ) {
        const { reply, requestId } = params
        reply.type('application/x-ndjson')

        let queue: string[] | null = []
        pubsub.subscribe(`agent-response:${requestId}`, (message) => {
            if (queue === null) return;
            queue!.push(message)
            if (message == "end") queue = null
        })

        async function* streamJson() {
          while (queue !== null) {
            const message = queue!.shift()
            if (message) {
              yield message + '\n'
            }
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          pubsub.unsubscribe(`agent-response:${requestId}`)
        }
      
        return reply.send(streamJson())
    }
})


type StreamAgentResponseRequest = {
    reply: FastifyReply
    requestId   : string
    
}