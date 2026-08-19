import { ActivepiecesError, apId, ApId, assertNotNullOrUndefined, ErrorCode, isNil, unique } from '@activepieces/core-utils'
import { AgentFlowTool, AgentOutputField, AgentRunSource, AgentTool, AgentToolType, AIProviderName, LATEST_JOB_DATA_SCHEMA_VERSION, MAX_AGENT_OUTPUT_FIELDS, MAX_AGENT_STEP_BUDGET, MAX_AGENT_TEXT_LENGTH, MAX_AGENT_TOOLS, PrincipalType, ResolvedAgentFlowTool, TASK_COMPLETION_TOOL_NAME, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { flowService } from '../../flows/flow/flow.service'
import { extractMcpTriggerInput, mcpPropertyToZod } from '../../mcp/mcp-server-builder'
import { assertCreditsAndAppSumoNotExceeded } from '../../platform/billing-provider'
import { projectService } from '../../project/project-service'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { agentHelpers } from './agent-helpers'

const RUN_PRINCIPALS = [PrincipalType.ENGINE] as const

export const agentRunController: FastifyPluginAsyncZod = async (app) => {
    app.post('/runs', StartAgentRunRoute, async (request, reply) => {
        const { instruction, modelName, provider, flowRunId, waitpointId, tools, structuredOutput, maxSteps } = request.body
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
        const supportedToolTypes = [AgentToolType.PIECE, AgentToolType.MCP, AgentToolType.FLOW, AgentToolType.KNOWLEDGE_BASE]
        const supportedTools = (tools ?? []).filter((tool) => supportedToolTypes.includes(tool.type))
        const flowToolRequests = (tools ?? []).filter((tool): tool is AgentFlowTool => tool.type === AgentToolType.FLOW)
        const unsupported = unique((tools ?? []).map((tool) => tool.type)).filter((type) => !supportedToolTypes.includes(type))
        if (unsupported.length > 0) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `An agent step cannot use ${unsupported.join(' or ')} tools yet` } })
        }
        const usesCompletionTool = (structuredOutput?.length ?? 0) > 0
        const reserved = (tools ?? []).filter((tool) => tool.toolName.startsWith(BUILT_IN_TOOL_PREFIX) || (usesCompletionTool && tool.toolName === TASK_COMPLETION_TOOL_NAME)).map((tool) => tool.toolName)
        if (reserved.length > 0) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `A tool cannot be named ${unique(reserved).join(' or ')}: names starting with "${BUILT_IN_TOOL_PREFIX}" belong to the agent's own tools` } })
        }
        const duplicated = unique((tools ?? []).map((tool) => tool.toolName).filter((name, index, all) => all.indexOf(name) !== index))
        if (duplicated.length > 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `Two tools are both named ${duplicated.join(', ')}: each tool on a step needs its own name, or one silently replaces the other` },
            })
        }
        const flowTools = await resolveFlowTools({ projectId, flowToolRequests, log: request.log })
        await agentHelpers.assertRunProviderConfigured({ platformId: platform.id, provider, log: request.log })
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
                tools: supportedTools,
                flowTools,
                structuredOutput,
                maxSteps,
                provider,
            },
        })

        log.info({ project: { id: projectId } }, '[agentRunController] Enqueued flow-step agent run')
        return reply.status(StatusCodes.OK).send({ conversationId, runId })
    })
}

async function resolveFlowTools({ projectId, flowToolRequests, log }: {
    projectId: string
    flowToolRequests: AgentFlowTool[]
    log: FastifyBaseLogger
}): Promise<ResolvedAgentFlowTool[]> {
    if (flowToolRequests.length === 0) {
        return []
    }
    const externalFlowIds = unique(flowToolRequests.map((tool) => tool.externalFlowId))
    const { data: matchedFlows } = await flowService(log).list({
        projectIds: [projectId],
        externalIds: externalFlowIds,
        cursorRequest: null,
        includeTriggerSource: false,
    })
    const flowsByExternalId = new Map(matchedFlows.map((flow) => [flow.externalId, flow]))
    const missing = flowToolRequests.filter((tool) => !flowsByExternalId.has(tool.externalFlowId))
    if (missing.length > 0) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `An agent step cannot use flow tool(s) ${unique(missing.map((tool) => tool.toolName)).join(', ')}: the referenced flow was not found in this project` },
        })
    }
    const runnableByExternalId = new Map(await Promise.all(matchedFlows.map(async (flow) => {
        const runnable = isNil(flow.publishedVersionId) || flow.publishedVersionId === flow.version.id
            ? flow
            : await flowService(log).getOnePopulatedOrThrow({ id: flow.id, projectId, versionId: flow.publishedVersionId })
        return [flow.externalId, runnable] as const
    })))
    return flowToolRequests.map((toolRequest) => {
        const flow = runnableByExternalId.get(toolRequest.externalFlowId)
        assertNotNullOrUndefined(flow, `flow for tool ${toolRequest.toolName}`)
        const { toolDescription, mcpInputs, returnsResponse } = extractMcpTriggerInput(flow)
        const inputShape = Object.fromEntries(mcpInputs.map((property) => [property.name, mcpPropertyToZod(property)]))
        return {
            toolName: toolRequest.toolName,
            flowId: flow.id,
            description: toolDescription.length > 0 ? toolDescription : `Run the flow "${flow.version.displayName}"`,
            inputSchema: z.toJSONSchema(z.object(inputShape)),
            returnsResponse,
        }
    })
}

const RUNS_PER_MINUTE = 60
const BUILT_IN_TOOL_PREFIX = 'ap_'

const StartAgentRunRequest = z.object({
    instruction: z.string().min(1).max(MAX_AGENT_TEXT_LENGTH),
    flowRunId: ApId,
    waitpointId: ApId,
    tools: z.array(AgentTool).max(MAX_AGENT_TOOLS).optional(),
    structuredOutput: z.array(AgentOutputField).max(MAX_AGENT_OUTPUT_FIELDS).optional(),
    maxSteps: z.number().int().positive().max(MAX_AGENT_STEP_BUDGET).optional(),
    modelName: z.string().optional(),
    provider: z.enum(AIProviderName).optional(),
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
