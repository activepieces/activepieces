import { ActivepiecesError, apId, ApId, ErrorCode } from '@activepieces/core-utils'
import { AgentRunSource, LATEST_JOB_DATA_SCHEMA_VERSION, PrincipalType, WorkerJobType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { assertCreditsAndAppSumoNotExceeded } from '../../platform/billing-provider'
import { projectService } from '../../project/project-service'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { agentHelpers } from './agent-helpers'

const RUN_PRINCIPALS = [PrincipalType.ENGINE] as const

export const agentRunController: FastifyPluginAsyncZod = async (app) => {
    app.post('/runs', StartAgentRunRoute, async (request, reply) => {
        const { instruction, modelName, flowRunId, waitpointId } = request.body
        if (request.principal.type !== PrincipalType.ENGINE) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: { message: 'Only a running flow can start an agent run' },
            })
        }
        const { projectId, platform } = request.principal
        const { allowed, count } = await agentHelpers.incrementAndCheckLimit({ key: `flow-agent-runs:${projectId}`, limit: RUNS_PER_MINUTE, ttlSeconds: 60 })
        if (!allowed) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `This project started ${count} agent runs in the last minute, above the limit of ${RUNS_PER_MINUTE}` } })
        }
        await assertCreditsAndAppSumoNotExceeded({ platformId: platform.id, log: request.log })
        const { ownerId } = await projectService(request.log).getOneOrThrow(projectId)

        const conversationId = apId()
        const runId = apId()
        const log = request.log.child({ conversation: { id: conversationId }, run: { id: runId } })

        await jobQueue(log).add({
            id: apId(),
            type: JobType.ONE_TIME,
            data: {
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                jobType: WorkerJobType.EXECUTE_AGENT_RUN,
                conversationId,
                runId,
                projectId,
                platformId: platform.id,
                userId: ownerId,
                userMessage: instruction,
                modelName: modelName ?? null,
                source: AgentRunSource.FLOW_STEP,
                flowRunId,
                waitpointId,
            },
        })

        log.info({ project: { id: projectId } }, '[agentRunController] Enqueued flow-step agent run')
        return reply.status(StatusCodes.OK).send({ conversationId, runId })
    })
}

const RUNS_PER_MINUTE = 60
const MAX_INSTRUCTION_LENGTH = 51_200

const StartAgentRunRequest = z.object({
    instruction: z.string().min(1).max(MAX_INSTRUCTION_LENGTH),
    flowRunId: ApId,
    waitpointId: ApId,
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
