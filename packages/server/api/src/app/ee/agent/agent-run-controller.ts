import { ActivepiecesError, apId, ApId, ErrorCode, unique } from '@activepieces/core-utils'
import { AgentOutputField, AgentRunSource, AgentTool, AgentToolType, LATEST_JOB_DATA_SCHEMA_VERSION, PrincipalType, TASK_COMPLETION_TOOL_NAME, WorkerJobType } from '@activepieces/shared'
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
        const { instruction, modelName, flowRunId, waitpointId, tools, structuredOutput } = request.body
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
        const pieceTools = (tools ?? []).filter((tool) => tool.type === AgentToolType.PIECE)
        const unsupported = unique((tools ?? []).map((tool) => tool.type)).filter((type) => type !== AgentToolType.PIECE)
        if (unsupported.length > 0) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `An agent step cannot use ${unsupported.join(' or ')} tools yet, only piece actions` } })
        }
        const usesCompletionTool = (structuredOutput?.length ?? 0) > 0
        const reserved = pieceTools.filter((tool) => tool.toolName.startsWith(BUILT_IN_TOOL_PREFIX) || (usesCompletionTool && tool.toolName === TASK_COMPLETION_TOOL_NAME)).map((tool) => tool.toolName)
        if (reserved.length > 0) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `A tool cannot be named ${unique(reserved).join(' or ')}: names starting with "${BUILT_IN_TOOL_PREFIX}" belong to the agent's own tools` } })
        }
        if (pieceTools.some((tool) => tool.pieceMetadata.actionName === CUSTOM_API_CALL)) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'An agent step cannot use a custom API call: it would let the agent send this project\'s credentials to any address it chooses' } })
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
                tools: pieceTools,
                structuredOutput,
            },
        })

        log.info({ project: { id: projectId } }, '[agentRunController] Enqueued flow-step agent run')
        return reply.status(StatusCodes.OK).send({ conversationId, runId })
    })
}

const RUNS_PER_MINUTE = 60
const MAX_INSTRUCTION_LENGTH = 51_200
const MAX_TOOLS = 100
const CUSTOM_API_CALL = 'custom_api_call'
const BUILT_IN_TOOL_PREFIX = 'ap_'
const MAX_OUTPUT_FIELDS = 50

const StartAgentRunRequest = z.object({
    instruction: z.string().min(1).max(MAX_INSTRUCTION_LENGTH),
    flowRunId: ApId,
    waitpointId: ApId,
    tools: z.array(AgentTool).max(MAX_TOOLS).optional(),
    structuredOutput: z.array(AgentOutputField).max(MAX_OUTPUT_FIELDS).optional(),
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
