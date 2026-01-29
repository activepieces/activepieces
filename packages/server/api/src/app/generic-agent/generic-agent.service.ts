import { AgentStreamingEvent, AgentStreamingUpdate, apId, ExecuteAgentJobData, ExecuteAgentRequest, PlatformId, WorkerJobType } from "@activepieces/shared"
import { FastifyBaseLogger, FastifyReply } from "fastify"
import { jobQueue } from "../workers/queue/job-queue"
import { JobType } from "../workers/queue/queue-manager"
import { pubsub } from "../helper/pubsub"

export const genericAgentService = (log: FastifyBaseLogger) => ({
    async executeAgent(params: ExecuteAgentRequest & { platformId: PlatformId } ): Promise<string> {
        const requestId = apId()
        const jobData: ExecuteAgentJobData = {
            platformId: params.platformId,
            projectId: params.projectId,
            session: {
                provider: params.provider,
                systemPrompt: params.systemPrompt,
                prompt: params.prompt,
                tools: params.tools,
                modelId: params.modelId,
                state: params.state,
                conversation: params.conversation ?? [],
                structuredOutput: params.structuredOutput,
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
        reply.raw.setHeader('Content-Type', 'application/x-ndjson')
        reply.raw.setHeader('Connection', 'keep-alive')

        pubsub.subscribe(`agent-response:${requestId}`, async (message) => {
            try {
                const messageJson = JSON.parse(message) as AgentStreamingUpdate
                reply.raw.write(message)
                if (messageJson.event === AgentStreamingEvent.AGENT_STREAMING_ENDED) {
                    pubsub.unsubscribe(`agent-response:${requestId}`)
                    reply.raw.end()
                }
            } catch (error) {
                reply.raw.destroy(error as Error)
            }
           
        })
        return reply
    }
})


type StreamAgentResponseRequest = {
    reply: FastifyReply
    requestId   : string
    
}