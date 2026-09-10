import { flowStructureUtil } from '@activepieces/core-execution'
import { ActivepiecesError, apId, ApId, assertNotNullOrUndefined, ErrorCode, isNil, spreadIfDefined, unique } from '@activepieces/core-utils'
import { AgentConfig, AgentFlowTool, AgentOutputField, AgentPieceProps, AgentRunSource, AgentTool, AgentToolType, AIProviderName, FlowVersionState, LATEST_JOB_DATA_SCHEMA_VERSION, MAX_AGENT_OUTPUT_FIELDS, MAX_AGENT_STEP_BUDGET, MAX_AGENT_TEXT_LENGTH, MAX_AGENT_TOOLS, PrincipalType, ResolvedAgentFlowTool, TASK_COMPLETION_TOOL_NAME, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { extractMcpTriggerInput } from '../../mcp/mcp-server-builder'
import { mcpToolInput } from '../../mcp/mcp-tool-input'
import { assertCreditsAndAppSumoNotExceeded } from '../../platform/billing-provider'
import { projectService } from '../../project/project-service'
import { waitpointService } from '../../waitpoints/waitpoint-service'
import { WaitpointStatus } from '../../waitpoints/waitpoint-types'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { agentHelpers } from './agent-helpers'
import { agentService } from './agent-service'

const RUN_PRINCIPALS = [PrincipalType.ENGINE] as const

export const agentRunController: FastifyPluginAsyncZod = async (app) => {
    app.post('/runs', StartAgentRunRoute, async (request, reply) => {
        const { instruction, flowRunId, waitpointId, agentId, providerConfigId, tools: inlineTools } = request.body
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
        if (!isNil(agentId) && (inlineTools?.length ?? 0) > 0) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'This step both links an agent and carries its own tools, so which one to run is ambiguous' } })
        }
        if (!isNil(agentId) && !await agentHelpers.agentsSurfaceAvailable({ platformId: platform.id, log: request.log })) {
            throw new ActivepiecesError({ code: ErrorCode.FEATURE_DISABLED, params: { message: 'This step runs a saved agent, and agents are not available on this platform' } })
        }
        const linked = isNil(agentId) ? null : await resolvePublishedAgent({ projectId, externalId: agentId, flowRunId, waitpointId, log: request.log })
        const runFields = isNil(linked)
            ? {
                tools: request.body.tools,
                structuredOutput: request.body.structuredOutput,
                maxSteps: request.body.maxSteps,
                modelName: request.body.modelName ?? null,
                ...spreadIfDefined('provider', request.body.provider),
                ...spreadIfDefined('providerConfigId', providerConfigId),
            }
            : agentHelpers.jobFieldsFromConfig({ config: linked })
        const { tools, structuredOutput, provider } = runFields
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
        await agentHelpers.assertRunProviderConfigured({ platformId: platform.id, provider, providerConfigId: runFields.providerConfigId, scope: agentHelpers.runScopeOrThrow({ projectId }), log: request.log })
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
                source: AgentRunSource.FLOW_STEP,
                flowRunId,
                waitpointId,
                flowTools,
                ...runFields,
                tools: supportedTools,
            },
        })

        log.info({ project: { id: projectId } }, '[agentRunController] Enqueued flow-step agent run')
        return reply.status(StatusCodes.OK).send({ conversationId, runId })
    })
}

async function resolvePublishedAgent({ projectId, externalId, flowRunId, waitpointId, log }: {
    projectId: string
    externalId: string
    flowRunId: string
    waitpointId: string
    log: FastifyBaseLogger
}): Promise<AgentConfig> {
    const flowRun = await flowRunService(log).getOneOrThrow({ id: flowRunId, projectId })
    const waitpoint = await waitpointService(log).findByIdAndFlowRunId({ waitpointId, flowRunId })
    if (isNil(waitpoint)) {
        throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'That waitpoint does not belong to this run, so there is no step to run an agent for' } })
    }
    if (waitpoint.status !== WaitpointStatus.PENDING) {
        throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'That step has already had its agent run. A finished waitpoint cannot start another one.' } })
    }
    const flowVersion = await flowVersionService(log).getOneOrThrow(flowRun.flowVersionId)
    const named = flowStructureUtil.getAllSteps(flowVersion.trigger).filter((candidate) => candidate.name === waitpoint.stepName)
    if (named.length > 1) {
        throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `More than one step in this flow is called "${waitpoint.stepName}", so which one paused is ambiguous. Rename one of them.` } })
    }
    const [step] = named
    if (isNil(step) || !flowStructureUtil.isAgentPiece(step) || step.settings.input?.[AgentPieceProps.AGENT_ID] !== externalId) {
        throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'This step did not name that agent when the flow was saved. An agent has to be picked on the step, not supplied while the flow runs.' } })
    }
    const agent = await agentService(log).getProjectVisibleByExternalId({ projectId, externalId })
    if (isNil(agent)) {
        throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'The agent this step runs is not available to this project. A flow runs unattended, so a step can only run an agent the whole project can see.' } })
    }
    if (isNil(agent.published)) {
        throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `Publish "${agent.displayName}" before a flow can run it: a flow runs the published version, so there is nothing to run yet.` } })
    }
    return agent.published
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
    const listFlows = (versionState: FlowVersionState) => flowService(log).list({
        projectIds: [projectId],
        externalIds: externalFlowIds,
        cursorRequest: null,
        includeTriggerSource: false,
        versionState,
    })
    const [published, drafts] = await Promise.all([listFlows(FlowVersionState.LOCKED), listFlows(FlowVersionState.DRAFT)])
    const publishedByExternalId = new Map(published.data.map((flow) => [flow.externalId, flow]))
    const runnableByExternalId = new Map(drafts.data.map((flow) => [flow.externalId, publishedByExternalId.get(flow.externalId) ?? flow]))
    const missing = flowToolRequests.filter((tool) => !runnableByExternalId.has(tool.externalFlowId))
    if (missing.length > 0) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `An agent step cannot use flow tool(s) ${unique(missing.map((tool) => tool.toolName)).join(', ')}: the referenced flow was not found in this project` },
        })
    }
    return flowToolRequests.map((toolRequest) => {
        const flow = runnableByExternalId.get(toolRequest.externalFlowId)
        assertNotNullOrUndefined(flow, `flow for tool ${toolRequest.toolName}`)
        const { toolDescription, mcpInputs, returnsResponse } = extractMcpTriggerInput(flow)
        const inputShape = mcpToolInput.modelInputShape({ properties: mcpInputs })
        return {
            toolName: toolRequest.toolName,
            flowId: flow.id,
            flowVersionId: flow.version.id,
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
    agentId: z.optional(ApId),
    tools: z.array(AgentTool).max(MAX_AGENT_TOOLS).optional(),
    structuredOutput: z.array(AgentOutputField).max(MAX_AGENT_OUTPUT_FIELDS).optional(),
    maxSteps: z.number().int().positive().max(MAX_AGENT_STEP_BUDGET).optional(),
    modelName: z.string().optional(),
    provider: z.enum(AIProviderName).optional(),
    providerConfigId: z.string().optional(),
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
