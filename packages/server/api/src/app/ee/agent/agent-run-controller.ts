import { ActivepiecesError, apId, ErrorCode } from '@activepieces/core-utils'
import { AgentConversationStatus, AgentRunSource, LATEST_JOB_DATA_SCHEMA_VERSION, PrincipalType, WorkerJobType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { agentHelpers } from './agent-helpers'

const RUN_PRINCIPALS = [PrincipalType.ENGINE] as const

export const agentRunController: FastifyPluginAsyncZod = async (app) => {
    app.post('/', StartAgentRunRoute, async (request, reply) => {
        const { instruction, modelName, resumeUrl } = request.body
        if (request.principal.type !== PrincipalType.ENGINE) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: { message: 'Only a running flow can start an agent run' },
            })
        }
        const { projectId, platform, id: principalId } = request.principal

        const conversation = await agentHelpers.conversationRepo().save({
            id: apId(),
            platformId: platform.id,
            projectId,
            userId: principalId,
            source: AgentRunSource.FLOW_STEP,
            title: null,
            modelName: modelName ?? null,
            messages: [],
            status: AgentConversationStatus.IDLE,
        })

        const runId = apId()
        const log = request.log.child({ conversation: { id: conversation.id }, run: { id: runId } })

        await jobQueue(log).add({
            id: apId(),
            type: JobType.ONE_TIME,
            data: {
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                jobType: WorkerJobType.EXECUTE_AGENT_RUN,
                conversationId: conversation.id,
                runId,
                projectId,
                platformId: platform.id,
                userId: principalId,
                userMessage: instruction,
                modelName: modelName ?? null,
                source: AgentRunSource.FLOW_STEP,
                resumeUrl,
            },
        })

        log.info({ project: { id: projectId } }, '[agentRunController] Enqueued flow-step agent run')
        return reply.status(StatusCodes.OK).send({ conversationId: conversation.id, runId })
    })
}

const StartAgentRunRequest = z.object({
    instruction: z.string().min(1),
    resumeUrl: z.string().url(),
    modelName: z.string().optional(),
})

const StartAgentRunResponse = z.object({
    conversationId: z.string(),
    runId: z.string(),
})

const StartAgentRunRoute = {
    config: {
        security: securityAccess.publicPlatform(RUN_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        body: StartAgentRunRequest,
        response: { [StatusCodes.OK]: StartAgentRunResponse },
    },
}
