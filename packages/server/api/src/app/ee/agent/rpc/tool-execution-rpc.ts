import { ActivepiecesError, ErrorCode, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { AgentRunSource, agentToolClassification, ExecuteAgentToolRequest, ExecuteAgentToolResponse, ExecuteFlowToolRequest, ExecuteFlowToolResponse, ExecuteKnowledgeBaseToolRequest, ExecuteKnowledgeBaseToolResponse, ExecutePieceToolRequest, ExecutePieceToolResponse, FlowActionType, flowStructureUtil } from '@activepieces/shared'
import { embed } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { agentApprovalGate } from '.././agent-approval-gate'
import { agentHelpers } from '.././agent-helpers'
import { executeCrossProjectTool } from '.././tools/agent-tools'
import { pieceToolRunner } from '.././tools/piece-tool-runner'
import { flowService } from '../../../flows/flow/flow.service'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { knowledgeBaseService } from '../../../knowledge-base/knowledge-base.service'
import { extractMcpTriggerInput, resolveRunnableFlow, runFlowAsTool } from '../../../mcp/mcp-server-builder'

import { byteLengthOf, CONFIGURED_TOOL_SOURCES, configuredToolConversationOrThrow, confinedProjectFor, connectionForConfiguredTool, pinConnectionToAgent, recordAgentAction } from './rpc-shared'

export const toolExecutionRpc = (log: FastifyBaseLogger) => ({
    async executePieceTool(input: ExecutePieceToolRequest): Promise<ExecutePieceToolResponse> {
        const configuredRun = await configuredToolConversationOrThrow({ conversationId: input.conversationId })
        const { projectId, platformId } = configuredRun
        const model = await agentHelpers.resolveFastModel({ platformId, scope: { type: 'project', projectId }, log, ...spreadIfDefined('provider', input.provider), ...spreadIfDefined('providerConfigId', input.providerConfigId) })
        const piece = { pieceName: input.piece.pieceName, actionName: input.piece.actionName, ...spreadIfDefined('pieceVersion', input.piece.pieceVersion) }
        const connection = await connectionForConfiguredTool({ piece: input.piece, projectId, platformId, log })
        const { data: run, error: runError } = await tryCatch(async () => {
            const { resolvedInput, actionDisplayName, pieceDisplayName, classification } = await pieceToolRunner.resolveInput({
                model,
                piece,
                instruction: input.instruction,
                projectId,
                platformId,
                log,
                ...spreadIfDefined('predefinedInput', input.piece.predefinedInput),
                ...spreadIfDefined('connectionExternalId', connection.externalId),
            })
            const { result } = await pieceToolRunner.runResolved({ piece, resolvedInput, projectId, log })
            return { result, resolvedInput: pieceToolRunner.withoutCredential(resolvedInput), actionDisplayName, pieceDisplayName, classification }
        })
        if (!isNil(runError) || isNil(run)) {
            log.error({ error: runError, tool: { name: input.toolName }, piece: { name: input.piece.pieceName, version: input.piece.pieceVersion ?? null }, action: { name: input.piece.actionName } }, '[agentRpc#executePieceTool] Configured action could not run')
            throw runError
        }
        log.info({ conversation: { id: input.conversationId }, tool: { name: input.toolName, input: run.resolvedInput }, connection: { externalId: connection.externalId ?? null }, piece: { name: input.piece.pieceName } }, '[agentRpc#executePieceTool] Ran a configured piece action')
        const flow = isNil(input.flowRunId) ? undefined : await flowOfRun({ flowRunId: input.flowRunId, projectId, log })
        recordAgentAction({
            run: configuredRun,
            conversationId: input.conversationId,
            ...spreadIfDefined('flow', flow),
            piece,
            resolvedInput: run.resolvedInput,
            names: { action: run.actionDisplayName, piece: run.pieceDisplayName },
            ...spreadIfDefined('classification', run.classification),
            connection,
            log,
        })
        return { result: run.result, resolvedInput: run.resolvedInput, actionDisplayName: run.actionDisplayName, ...spreadIfDefined('connectionLabel', connection.label) }
    },

    async executeKnowledgeBaseTool(input: ExecuteKnowledgeBaseToolRequest): Promise<ExecuteKnowledgeBaseToolResponse> {
        const conversation = await agentHelpers.conversationRepo().findOneBy({ id: input.conversationId })
        if (isNil(conversation) || !CONFIGURED_TOOL_SOURCES.includes(conversation.source) || isNil(conversation.projectId)) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'This run is not allowed to search a knowledge base' } })
        }
        const { projectId, platformId } = conversation
        const file = await knowledgeBaseService(log).getFileOrThrow({ projectId, id: input.knowledgeBaseFileId })
        const searchable = await knowledgeBaseService(log).isSearchable({ projectId, knowledgeBaseFileId: input.knowledgeBaseFileId })
        if (!searchable) {
            log.warn({ conversation: { id: input.conversationId }, project: { id: projectId }, knowledgeBaseFile: { id: input.knowledgeBaseFileId } }, '[agentRpc#executeKnowledgeBaseTool] The file has no searchable text, so the search was not run')
            return { result: `"${file.displayName}" is attached but has never been indexed, so its text cannot be searched and you have not read any of it. Tell the user exactly that. Do not say the file does not contain what they asked for, and do not suggest re-uploading it: that will not index it either.` }
        }
        const { model, providerOptions } = await agentHelpers.resolveEmbeddingModel({ platformId, scope: { type: 'project', projectId }, log, ...spreadIfDefined('provider', input.provider), ...spreadIfDefined('providerConfigId', input.providerConfigId) })
        const { embedding } = await embed({ model, value: input.query, providerOptions })
        const results = await knowledgeBaseService(log).search({
            projectId,
            knowledgeBaseFileIds: [input.knowledgeBaseFileId],
            queryEmbedding: agentAiUtils.toStorageEmbedding(embedding),
            limit: KNOWLEDGE_BASE_SEARCH_LIMIT,
            similarityThreshold: KNOWLEDGE_BASE_SIMILARITY_THRESHOLD,
        })
        log.info({ conversation: { id: input.conversationId }, tool: { name: input.toolName }, project: { id: projectId }, resultCount: results.length }, '[agentRpc#executeKnowledgeBaseTool] Ran a knowledge base search')
        if (results.length === 0) {
            return { result: 'No relevant information found.' }
        }
        return {
            result: results.map((result, index) => ({
                rank: index + 1,
                content: result.content,
                relevanceScore: result.score,
            })),
        }
    },

    async executeFlowTool(input: ExecuteFlowToolRequest): Promise<ExecuteFlowToolResponse> {
        const conversation = await agentHelpers.conversationRepo().findOneBy({ id: input.conversationId })
        if (isNil(conversation) || !CONFIGURED_TOOL_SOURCES.includes(conversation.source) || isNil(conversation.projectId)) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'This run is not allowed to run a flow tool' } })
        }
        const flow = await flowService(log).getOnePopulated({ id: input.flowId, projectId: conversation.projectId, ...spreadIfDefined('versionId', input.flowVersionId) })
        if (isNil(flow)) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'That flow is not in this run\'s project' } })
        }
        const advertised = isNil(input.flowVersionId) ? await resolveRunnableFlow({ flow, projectId: conversation.projectId, log }) : flow
        const result = await runFlowAsTool({ flow: advertised, properties: extractMcpTriggerInput(advertised).mcpInputs, payload: input.toolInput, returnsResponse: input.returnsResponse, log })
        log.info({ conversation: { id: input.conversationId }, tool: { name: input.toolName }, flow: { id: flow.id } }, '[agentRpc#executeFlowTool] Ran a flow tool')
        return { result }
    },

    async executeAgentTool(input: ExecuteAgentToolRequest): Promise<ExecuteAgentToolResponse> {
        if (ATTENDED_STATE_TOOLS.includes(input.toolName) && input.source === AgentRunSource.FLOW_STEP) {
            log.error({ tool: { name: input.toolName }, source: input.source }, '[agentRpc#executeAgentTool] Rejected an attended-only tool for an unattended run — the worker should not have called it')
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: { message: `Tool "${input.toolName}" is only available to attended runs` },
            })
        }
        const chatOnlyTool = !ATTENDED_STATE_TOOLS.includes(input.toolName)
            && (input.toolName.startsWith(CHAT_ONLY_TOOL_PREFIX) || OWNER_SCOPED_TOOLS.includes(input.toolName) || UNATTENDED_FORBIDDEN_TOOLS.includes(input.toolName))
        const allowedSources = SELF_EDIT_TOOLS.includes(input.toolName)
            ? [AgentRunSource.CHAT, AgentRunSource.AGENT_BUILDER, AgentRunSource.AGENT]
            : AGENT_SURFACE_TOOLS.includes(input.toolName)
                ? [AgentRunSource.CHAT, AgentRunSource.AGENT_BUILDER]
                : [AgentRunSource.CHAT]
        if (chatOnlyTool && !allowedSources.includes(input.source)) {
            log.error({ tool: { name: input.toolName }, source: input.source }, '[agentRpc#executeAgentTool] Rejected a chat-only tool for a non-chat run — the worker should not have called it')
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: { message: `Tool "${input.toolName}" is only available to chat runs` },
            })
        }
        if (input.toolName === '__cancel_check') {
            const conversationId = input.toolInput.conversationId
            if (typeof conversationId !== 'string') {
                return { result: false }
            }
            const runId = typeof input.toolInput.runId === 'string' ? input.toolInput.runId : undefined
            const cancelled = await agentApprovalGate.isCancelled({ conversationId, runId })
            return { result: cancelled }
        }
        if (input.toolName === '__approval_wait') {
            const gateId = input.toolInput.gateId
            if (typeof gateId !== 'string') {
                return { result: 'pending' }
            }
            const rawTimeout = input.toolInput.timeoutMs
            const timeoutMs = Math.min(typeof rawTimeout === 'number' ? rawTimeout : MAX_APPROVAL_BLOCK_MS, MAX_APPROVAL_BLOCK_MS)
            const decision = await agentApprovalGate.waitForDecision({ gateId, timeoutMs })
            return { result: decision }
        }
        if (input.toolName === '__store_pending_gate') {
            const { conversationId: convId, runId: gateRunId, gateId, toolName: gateTool, displayName, toolInput: gateInput } = input.toolInput
            if (typeof convId === 'string' && typeof gateId === 'string' && typeof gateTool === 'string') {
                await agentApprovalGate.storePendingGate({
                    conversationId: convId,
                    gate: {
                        gateId,
                        toolName: gateTool,
                        displayName: typeof displayName === 'string' ? displayName : gateTool,
                        toolInput: typeof gateInput === 'object' && gateInput !== null ? gateInput as Record<string, unknown> : {},
                        ...(typeof gateRunId === 'string' ? { runId: gateRunId } : {}),
                    },
                })
            }
            return { result: { success: true } }
        }
        if (input.toolName === '__store_selected_connection') {
            const { pieceName, connectionExternalId, label, projectId } = input.toolInput
            if (typeof input.conversationId === 'string' && typeof pieceName === 'string' && typeof connectionExternalId === 'string') {
                await agentApprovalGate.storeSelectedConnection({
                    conversationId: input.conversationId,
                    pieceName,
                    externalId: connectionExternalId,
                    label: typeof label === 'string' ? label : connectionExternalId,
                    projectId: typeof projectId === 'string' ? projectId : '',
                })
                await pinConnectionToAgent({
                    conversationId: input.conversationId,
                    pieceName,
                    externalId: connectionExternalId,
                    platformId: input.platformId,
                    userId: input.userId,
                    log,
                })
            }
            return { result: { success: true } }
        }
        if (input.toolName === '__flow_write_check') {
            const flowId = input.toolInput.flowId
            if (typeof flowId !== 'string' || typeof input.conversationId !== 'string') {
                return { result: { hasWrites: false } }
            }
            const conversation = await agentHelpers.getConversationOrThrow({ id: input.conversationId, platformId: input.platformId, userId: input.userId })
            if (isNil(conversation.projectId)) {
                return { result: { hasWrites: false } }
            }
            const flow = await flowService(log).getOnePopulated({ id: flowId, projectId: conversation.projectId })
            if (isNil(flow)) {
                return { result: { hasWrites: false } }
            }
            const writeSteps = flowStructureUtil.getAllSteps(flow.version.trigger)
                .filter((step) => step.type === FlowActionType.PIECE
                    && typeof step.settings.actionName === 'string'
                    && agentToolClassification.isWriteActionName(step.settings.actionName))
                .map((step) => step.displayName)
            log.info({ flow: { id: flowId }, hasWrites: writeSteps.length > 0, writeStepCount: writeSteps.length }, '[agentRpc#executeAgentTool] Flow write check')
            return { result: { hasWrites: writeSteps.length > 0, flowName: flow.version.displayName, writeSteps } }
        }
        if (input.toolName === '__get_available_connections') {
            const { pieceName } = input.toolInput
            if (typeof input.conversationId === 'string' && typeof pieceName === 'string') {
                const connections = await agentApprovalGate.getAvailableConnections({ conversationId: input.conversationId, pieceName })
                return { result: connections }
            }
            return { result: [] }
        }

        log.debug({ tool: { name: input.toolName, input: input.toolInput } }, '[agentRpc#executeAgentTool] Tool invoke')
        const startedAt = Date.now()
        const result = await executeCrossProjectTool({
            toolName: input.toolName,
            toolInput: input.toolInput,
            platformId: input.platformId,
            userId: input.userId,
            conversationId: input.conversationId,
            confinedToProjectId: input.source === AgentRunSource.CHAT ? null : await confinedProjectFor({ conversationId: input.conversationId }),
            editsOwnAgentOnly: input.source === AgentRunSource.AGENT,
            log,
        })
        log.debug({ tool: { name: input.toolName, durationMs: Date.now() - startedAt, output: result }, resultBytes: byteLengthOf(result) }, '[agentRpc#executeAgentTool] Tool finished')
        return { result }
    },

})


const MAX_APPROVAL_BLOCK_MS = 50_000
const CHAT_ONLY_TOOL_PREFIX = '__'
const OWNER_SCOPED_TOOLS = ['ap_remember']
const ATTENDED_STATE_TOOLS = ['__cancel_check', '__approval_wait', '__store_pending_gate', '__store_selected_connection']
const SELF_EDIT_TOOLS = ['ap_update_agent', 'ap_add_agent_tool', 'ap_remove_agent_tool']
const AGENT_SURFACE_TOOLS = ['ap_list_agents', 'ap_create_agent', ...SELF_EDIT_TOOLS]
const UNATTENDED_FORBIDDEN_TOOLS = ['ap_run_code', 'ap_execute_action', 'ap_explore_data', 'ap_list_across_projects', ...AGENT_SURFACE_TOOLS]
const KNOWLEDGE_BASE_SEARCH_LIMIT = 5
const KNOWLEDGE_BASE_SIMILARITY_THRESHOLD = 0.5

async function flowOfRun({ flowRunId, projectId, log }: { flowRunId: string, projectId: string, log: FastifyBaseLogger }): Promise<{ id: string, runId: string } | undefined> {
    const { data: flowRun, error } = await tryCatch(() => flowRunService(log).getOneOrThrow({ id: flowRunId, projectId }))
    if (isNil(flowRun)) {
        log.warn({ error, flowRun: { id: flowRunId }, project: { id: projectId } }, '[agentRpc#executePieceTool] Could not name the flow run behind this action; the audit event ships without it and every webhook-flow destination is dropped')
        return undefined
    }
    return { id: flowRun.flowId, runId: flowRun.id }
}
