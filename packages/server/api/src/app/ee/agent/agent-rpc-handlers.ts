import { ActivepiecesError, ErrorCode, isNil, sanitizeObjectForPostgresql, spreadIfDefined, tryCatch, unique } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { AgentConfigResponse, AgentConversation, AgentConversationStatus, AgentRunSource, agentToolClassification, ExecuteAgentToolRequest, ExecuteAgentToolResponse, ExecuteFlowToolRequest, ExecuteFlowToolResponse, ExecuteKnowledgeBaseToolRequest, ExecuteKnowledgeBaseToolResponse, ExecutePieceToolRequest, ExecutePieceToolResponse, FileCompression, FileType, FlowActionType, flowStructureUtil, GetAgentConfigRequest, GetEnabledAiToolsResponse, HeartbeatAgentConversationRequest, PersistedAgentMessage, PersistedAgentPartType, PersistedAgentRole, ResumeFlowStepRequest, SaveAgentFileRequest, SaveAgentFileResponse, SaveAgentMessagesRequest, SendAgentEmailRequest, SendAgentEmailResponse, UpdateAgentProgressRequest, UpdateFlowStepProgressRequest, UpdateProjectContextRequest } from '@activepieces/shared'
import { embed, ModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { aiToolConfigService } from '../../ai/ai-tool-config-service'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { fileService } from '../../file/file.service'
import { filesService } from '../../file/files-service'
import { flowService } from '../../flows/flow/flow.service'
import { engineRunCallbackService } from '../../flows/flow-run/engine-run-callback-service'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { resumeService } from '../../flows/flow-run/waitpoint/resume-service'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { knowledgeBaseService } from '../../knowledge-base/knowledge-base.service'
import { runFlowAsTool } from '../../mcp/mcp-server-builder'
import { userService } from '../../user/user-service'
import { smtpEmailSender } from '../helper/email/email-sender/smtp-email-sender'
import { emailService } from '../helper/email/email-service'
import { agentApprovalGate } from './agent-approval-gate'
import { agentCompaction } from './agent-compaction'
import { buildAttachmentNote, buildUserContentWithFiles, persistAgentAttachments } from './agent-file-utils'
import { agentHelpers } from './agent-helpers'
import { chatAnalyticsTelemetry } from './chat-analytics-sync'
import { chatUsageTracker } from './chat-usage-tracker'
import { agentMcp } from './mcp/agent-mcp'
import { agentPrompt } from './prompt/agent-prompt'
import { agentSurfaceNotes } from './prompt/agent-surface-notes'
import { executeCrossProjectTool } from './tools/agent-tools'
import { pieceToolRunner } from './tools/piece-tool-runner'

const MAX_APPROVAL_BLOCK_MS = 50_000
const CHAT_ONLY_TOOL_PREFIX = '__'
const OWNER_SCOPED_TOOLS = ['ap_remember']
const ATTENDED_STATE_TOOLS = ['__cancel_check', '__approval_wait', '__store_pending_gate', '__store_selected_connection']
const CONFIGURED_TOOL_SOURCES: AgentRunSource[] = [AgentRunSource.FLOW_STEP, AgentRunSource.AGENT]
const UNATTENDED_FORBIDDEN_TOOLS = ['ap_run_code', 'ap_execute_action', 'ap_explore_data', 'ap_list_across_projects']
const KNOWLEDGE_BASE_SEARCH_LIMIT = 5
const KNOWLEDGE_BASE_SIMILARITY_THRESHOLD = 0.5


const MAX_EMAIL_RECIPIENTS = 10
const MAX_EMAIL_SUBJECT_LENGTH = 300
const MAX_EMAIL_BODY_LENGTH = 10_000
const EMAILS_PER_CONVERSATION = 20
const EMAILS_PER_USER_PER_HOUR = 30
const CONVERSATION_LIMIT_TTL_SECONDS = 24 * 60 * 60
const HOURLY_LIMIT_TTL_SECONDS = 60 * 60
const CONNECTION_INVENTORY_LIMIT = 200

// Gate the UPDATE on the persisted owning run (activeRunId, claimed at turn start) so a run
// preempted by a newer message matches zero rows — the ownership check is part of the write, with
// no check-then-write window. A nil runId or unclaimed row (activeRunId IS NULL) writes freely.
async function updateConversationForRun({ conversationId, runId, updates }: {
    conversationId: string
    runId?: string
    updates: Record<string, unknown>
}): Promise<boolean> {
    const builder = agentHelpers.conversationRepo()
        .createQueryBuilder()
        .update()
        .set(updates)
        .where('id = :id', { id: conversationId })
    if (!isNil(runId)) {
        builder.andWhere('("activeRunId" IS NULL OR "activeRunId" = :runId)', { runId })
    }
    const result = await builder.returning('id').execute()
    const updatedRows: unknown[] = result.raw ?? []
    return updatedRows.length > 0
}

export const agentRpcHandlers = (log: FastifyBaseLogger) => ({
    async getAgentConfig(input: GetAgentConfigRequest): Promise<AgentConfigResponse> {
        const { conversationId, platformId, userId, userMessage, modelName, files, promptOverride, dryRun, source: requestedSource, projectId: requestedProjectId } = input

        // A flow-step run gets none of the owner's chat context, so it is not fetched. Reading it
        // anyway meant an owner without an MCP token or a user record failed the run outright.
        const isFlowStep = requestedSource === AgentRunSource.FLOW_STEP
        // A saved agent answers from its own instructions, so one person's remembered preferences
        // must not change how it behaves for everyone else who talks to it.
        const carriesChatContext = requestedSource !== AgentRunSource.FLOW_STEP && requestedSource !== AgentRunSource.AGENT

        const [conversation, providerConfig, userProjects, enabledAiTools] = await Promise.all([
            loadOrStartConversation({ conversationId, platformId, userId, source: requestedSource, projectId: requestedProjectId, modelName }),
            agentHelpers.resolveRunProvider({ platformId, log, ...spreadIfDefined('provider', input.provider) }),
            agentHelpers.getUserProjects({ platformId, userId, log }),
            aiToolConfigService(log).getEnabledTools({ platformId }),
        ])

        const [scopedMcpCredentials, runMemory, runUserEmail] = !carriesChatContext
            ? [{ mcpServerUrl: null, mcpToken: null }, { instructions: null, memories: [] as string[] }, '']
            : await Promise.all([
                agentMcp.getCredentials({ platformId, userId, log }),
                agentHelpers.getUserMemory({ platformId, userId }),
                userService(log).getMetaInformation({ id: userId }).then((meta) => meta.email),
            ])

        if (isFlowStep !== (conversation.source === AgentRunSource.FLOW_STEP)) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'The run asked for a different surface than the conversation it belongs to' } })
        }

        const scopedProjects = conversation.source === AgentRunSource.FLOW_STEP
            ? userProjects.filter((p) => p.id === conversation.projectId)
            : userProjects

        const attachmentProjectId = (conversation.projectId && scopedProjects.some((p) => p.id === conversation.projectId))
            ? conversation.projectId
            : scopedProjects[0]?.id
        const attachmentRefs = files && files.length > 0 && !isNil(attachmentProjectId)
            ? await persistAgentAttachments({ files, projectId: attachmentProjectId, platformId, log })
            : []
        const userContent = await buildUserContentWithFiles({ text: userMessage, files, attachmentNote: buildAttachmentNote(attachmentRefs) })

        const aiTools: GetEnabledAiToolsResponse = dryRun ? {} : enabledAiTools
        const emailEnabled = !dryRun && carriesChatContext && smtpEmailSender(log).isSmtpConfigured()
        const fetchAvailable = !dryRun
        // Tavily takes precedence over native LLM search; native is only the no-Tavily fallback.
        const tavilySearchAvailable = !isNil(aiTools.webSearch)
        const webSearchAvailable = fetchAvailable && (tavilySearchAvailable || agentAiUtils.supportsWebSearch(providerConfig.provider))

        const lockResult = await agentHelpers.conversationRepo()
            .createQueryBuilder()
            .update()
            .set({ status: AgentConversationStatus.STREAMING })
            .where('id = :id AND status != :streaming', { id: conversationId, streaming: AgentConversationStatus.STREAMING })
            .returning('id')
            .execute()
        const lockedRows: unknown[] = lockResult.raw ?? []
        if (lockedRows.length === 0) {
            log.warn({ conversation: { id: conversationId } }, '[agentRpc#getAgentConfig] Concurrent run rejected (conversation already STREAMING)')
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'An agent is already running for this conversation' },
            })
        }

        const candidateProjectId = conversation.projectId ?? null
        const validCandidateProjectId = candidateProjectId && scopedProjects.some((p) => p.id === candidateProjectId)
            ? candidateProjectId
            : null
        // Default to the user's first project when none is chosen so the agent never hits a cold
        // "No project selected" on the first data tool. The chat MCP server resolves its project
        // from conversation.projectId per request, so persist it (the user can switch via the
        // dropdown / ap_select_project, which overwrites this).
        const selectedProjectId = validCandidateProjectId ?? scopedProjects[0]?.id ?? null
        if (!dryRun && isNil(validCandidateProjectId) && !isNil(selectedProjectId)) {
            await agentHelpers.conversationRepo().update(conversationId, { projectId: selectedProjectId })
        }

        const selectedModel = modelName ?? conversation.modelName ?? null
        // The tier resolver finds no tier for a concrete model id and silently returns the default,
        // so a source that names its own model must never be routed through it.
        const tier = agentHelpers.resolveTier({ tierId: carriesChatContext ? selectedModel : null })
        const resolvedModelId = !carriesChatContext && !isNil(modelName)
            ? modelName
            : agentHelpers.resolveModelIdForProvider({ provider: providerConfig.provider, selectedModel })

        // Inject an inventory of the project's existing connections into context so the agent
        // never has to *guess* an app name to find out what's connected. Without this, discovery
        // is reactive and name-keyed (ap_discover_action_auth filters by an exact pieceName the
        // model inferred from the message), so a vague request ("my CRM") could miss a connection
        // that is right there. Best-effort: a lookup failure must not block the turn.
        // Chat picks a connection mid-run; a configured surface had one pinned when it was set up,
        // so handing it the inventory only teaches it to renegotiate what it cannot change.
        const inventoryResult = (!dryRun && carriesChatContext && !isNil(selectedProjectId))
            ? await tryCatch(() => appConnectionService(log).list({
                projectId: selectedProjectId,
                platformId,
                pieceName: undefined,
                displayName: undefined,
                status: undefined,
                cursorRequest: null,
                scope: undefined,
                externalIds: undefined,
                limit: CONNECTION_INVENTORY_LIMIT,
            }))
            : null
        const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
        const systemPromptText = agentPrompt.buildSystemPrompt({
            projects: scopedProjects,
            currentProjectId: selectedProjectId,
            frontendUrl,
            templates: promptOverride,
        }) + agentSurfaceNotes.buildRunNotes({
            source: conversation.source,
            currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
            searchAvailable: webSearchAvailable,
            fetchAvailable,
            scrapeAvailable: fetchAvailable && !isNil(aiTools.webScraping),
            imageAvailable: fetchAvailable && !isNil(aiTools.imageGeneration),
            emailAvailable: emailEnabled,
            userEmail: runUserEmail,
            connections: inventoryResult && !inventoryResult.error
                ? { connections: inventoryResult.data.data, truncated: inventoryResult.data.data.length >= CONNECTION_INVENTORY_LIMIT }
                : null,
            memory: runMemory,
        })
        // Merge over defaults, not replace: an override carries only the changed guide topics
        // (the eval fix-flow sends a partial), so a bare assignment would drop every other guide.
        const guides = promptOverride?.guides
            ? { ...agentPrompt.guides, ...promptOverride.guides }
            : agentPrompt.guides

        const previousMessages = conversation.messages as ModelMessage[]
        const newUserMessage: ModelMessage = { role: 'user' as const, content: userContent }
        const allMessages = [...previousMessages, newUserMessage]
        const llmHistory = agentAiUtils.collapseStaleToolOutputs({ messages: allMessages })

        const previousUiMessages = (conversation.uiMessages ?? []) as PersistedAgentMessage[]
        const uiMessagesWithUser: PersistedAgentMessage[] = [
            ...previousUiMessages,
            { role: PersistedAgentRole.USER, parts: [{ type: PersistedAgentPartType.TEXT, text: userMessage }] },
        ]
        await agentHelpers.conversationRepo().update(conversationId, {
            messages: allMessages,
            uiMessages: JSON.parse(JSON.stringify(uiMessagesWithUser)),
        })
        await agentApprovalGate.clearCancel({ conversationId })

        const estimatedTokens = agentCompaction.estimateTokenCount({ messages: llmHistory, systemPromptLength: systemPromptText.length })
        let compactionState = { summary: conversation.summary ?? null, summarizedUpToIndex: conversation.summarizedUpToIndex ?? null }

        const willCompact = agentCompaction.shouldCompact({ estimatedTokens, provider: providerConfig.provider, messageCount: llmHistory.length })
        log.debug({ estimatedTokens, willCompact, messageCount: llmHistory.length, systemPromptLength: systemPromptText.length }, '[agentRpc#getAgentConfig] Compaction decision')
        if (willCompact) {
            const model = agentAiUtils.createChatModel({
                provider: providerConfig.provider,
                auth: providerConfig.auth as Record<string, unknown>,
                config: providerConfig.config as Record<string, unknown>,
                modelId: resolvedModelId,
            })
            compactionState = await agentCompaction.compactMessages({
                messages: llmHistory,
                existingSummary: compactionState.summary,
                summarizedUpToIndex: compactionState.summarizedUpToIndex,
                provider: providerConfig.provider,
                model,
                log,
            })
            await agentHelpers.conversationRepo().update(conversationId, {
                summary: compactionState.summary,
                summarizedUpToIndex: compactionState.summarizedUpToIndex,
            })
            log.info({ summarizedUpToIndex: compactionState.summarizedUpToIndex, summaryLength: compactionState.summary?.length ?? 0 }, '[agentRpc#getAgentConfig] Compaction ran')
        }

        const messagesForLlm = agentCompaction.buildCompactedPayload({
            messages: llmHistory,
            summary: compactionState.summary,
            summarizedUpToIndex: compactionState.summarizedUpToIndex,
            provider: providerConfig.provider,
        })

        log.info({
            historyMessageCount: messagesForLlm.length,
            estimatedTokens,
            model: { id: resolvedModelId },
            provider: providerConfig.provider,
            tier: { id: tier.id },
            project: selectedProjectId ? { id: selectedProjectId } : undefined,
            webSearchAvailable,
        }, '[agentRpc#getAgentConfig] Chat config resolved')
        log.debug({ systemPrompt: systemPromptText, guideNames: Object.keys(guides) }, '[agentRpc#getAgentConfig] System prompt assembled')

        return {
            provider: providerConfig.provider,
            auth: providerConfig.auth as Record<string, unknown>,
            providerConfig: providerConfig.config as Record<string, unknown>,
            modelId: resolvedModelId,
            fastModelId: agentHelpers.resolveFastModelId({ provider: providerConfig.provider }),
            systemPrompt: systemPromptText,
            messages: messagesForLlm,
            allMessages,
            previousUiMessages: uiMessagesWithUser,
            tier: { id: tier.id, thinkingBudget: tier.thinkingBudget, modelId: tier.modelId },
            mcpCredentials: scopedMcpCredentials.mcpServerUrl && scopedMcpCredentials.mcpToken
                ? { mcpServerUrl: scopedMcpCredentials.mcpServerUrl, mcpToken: scopedMcpCredentials.mcpToken }
                : null,
            projects: scopedProjects.map((p) => ({ id: p.id, displayName: p.displayName, type: p.type })),
            guides,
            aiTools,
            emailEnabled,
            userEmail: runUserEmail,
            source: conversation.source,
        }
    },

    async saveAgentFile(input: SaveAgentFileRequest): Promise<SaveAgentFileResponse> {
        const conversation = await agentHelpers.conversationRepo().findOneBy({
            id: input.conversationId,
            platformId: input.platformId,
        })
        const projectId = conversation?.projectId ?? input.projectId
        const file = await fileService(log).save({
            projectId,
            platformId: input.platformId,
            data: input.data,
            size: input.data.length,
            type: FileType.FLOW_STEP_FILE,
            fileName: input.fileName,
            compression: FileCompression.NONE,
            metadata: { mimetype: input.mediaType },
        })
        const url = await filesService.constructReadUrl({
            fileId: file.id,
            fileType: file.type,
            platformId: input.platformId,
        })
        return { fileId: file.id, url }
    },

    async saveAgentMessages(input: SaveAgentMessagesRequest): Promise<void> {
        const isSuccessfulCompletion = input.messages.length > 0
        const updates: Record<string, unknown> = {
            status: isSuccessfulCompletion ? AgentConversationStatus.IDLE : AgentConversationStatus.ERROR,
        }

        // No-shrink guard against silent context loss. The LLM history only ever grows within a
        // conversation, so a final/abort/error save whose `messages` are FEWER than what's already
        // persisted means the turn's work was dropped before the save payload was built (an
        // aborted/errored turn whose completed steps never reached the accumulator, or the
        // error-path's empty `{messages:[],uiMessages:[]}` call). Refuse to overwrite content in
        // that case — keep the richer history that updateAgentProgress persisted incrementally. The
        // status still reflects success/error so the UI is correct; only the destructive content
        // overwrite is suppressed. (uiMessages tracks messages, so we gate both on the same check.)
        const storedMessageCount = ((await agentHelpers.conversationRepo().findOneBy({ id: input.conversationId }))?.messages as unknown[] | undefined)?.length ?? 0
        const wouldShrinkHistory = input.messages.length < storedMessageCount
        const persistContent = isSuccessfulCompletion && !wouldShrinkHistory

        if (persistContent) {
            updates.messages = input.messages
            updates.uiMessages = sanitizeObjectForPostgresql(input.uiMessages)
            if (input.title) updates.title = input.title
            if (input.modelName) updates.modelName = input.modelName
        }
        else if (wouldShrinkHistory) {
            log.warn({
                conversation: { id: input.conversationId },
                run: { id: input.runId },
                incomingMessageCount: input.messages.length,
                storedMessageCount,
            }, '[agentRpc#saveAgentMessages] Refused shrinking save — kept incrementally-persisted history')
        }

        const saveLanded = await updateConversationForRun({ conversationId: input.conversationId, runId: input.runId, updates })
        if (!saveLanded) {
            log.warn({ conversation: { id: input.conversationId }, run: { id: input.runId } }, 'saveAgentMessages: no row updated — conversation deleted or superseded by a newer run; skipping analytics and usage tracking')
        }
        log.info({
            conversation: { id: input.conversationId },
            messageCount: input.messages.length,
            uiMessageCount: input.uiMessages.length,
            contentPersisted: persistContent,
            status: updates.status,
            titlePresent: !isNil(input.title),
        }, '[agentRpc#saveAgentMessages] Conversation persisted')

        if (saveLanded && input.messages.length > 0) {
            const conversation = await agentHelpers.conversationRepo().findOneBy({ id: input.conversationId })
            if (conversation) {
                chatAnalyticsTelemetry(log).sendConversationUpdate({ conversation })
                rejectedPromiseHandler(chatUsageTracker(log).track({ conversation, runId: input.runId }), log)
            }
        }
    },

    async updateAgentProgress(input: UpdateAgentProgressRequest): Promise<void> {
        const updates: Record<string, unknown> = {
            uiMessages: JSON.parse(JSON.stringify(input.uiMessages)),
        }
        if (!isNil(input.messages)) {
            updates.messages = input.messages
        }
        await updateConversationForRun({ conversationId: input.conversationId, runId: input.runId, updates })
        log.debug({ conversation: { id: input.conversationId }, uiMessageCount: input.uiMessages.length, messageCount: input.messages?.length }, '[agentRpc#updateAgentProgress] Progress persisted')
    },

    async heartbeatAgentConversation(input: HeartbeatAgentConversationRequest): Promise<void> {
        // Liveness signal: bump `updated` only while STREAMING so stale-recovery in
        // getConversationOrThrow doesn't flip a genuinely-working long turn to IDLE. Gate on the
        // owning run so a superseded run can't keep a row it no longer owns alive.
        const builder = agentHelpers.conversationRepo()
            .createQueryBuilder()
            .update()
            .set({ updated: () => 'now()' })
            .where('id = :id AND status = :streaming', { id: input.conversationId, streaming: AgentConversationStatus.STREAMING })
        if (!isNil(input.runId)) {
            builder.andWhere('("activeRunId" IS NULL OR "activeRunId" = :runId)', { runId: input.runId })
        }
        await builder.execute()
    },

    async updateProjectContext(input: UpdateProjectContextRequest): Promise<void> {
        const conversation = await agentHelpers.conversationRepo().findOneBy({ id: input.conversationId })
        if (conversation?.source === AgentRunSource.FLOW_STEP && input.projectId !== conversation.projectId) {
            log.error({ conversation: { id: input.conversationId }, project: { id: input.projectId } }, '[agentRpc#updateProjectContext] Refused a project switch on a flow-step run')
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: { message: 'A flow-step agent run cannot move to another project' },
            })
        }
        await updateConversationForRun({ conversationId: input.conversationId, runId: input.runId, updates: { projectId: input.projectId } })
        log.info({ conversation: { id: input.conversationId }, project: input.projectId ? { id: input.projectId } : undefined }, '[agentRpc#updateProjectContext] Project context updated')
    },

    async updateFlowStepProgress(input: UpdateFlowStepProgressRequest): Promise<void> {
        const conversation = await agentHelpers.conversationRepo().findOne({ where: { id: input.conversationId }, select: ['source', 'projectId'] })
        if (conversation?.source !== AgentRunSource.FLOW_STEP || isNil(conversation.projectId)) {
            log.warn({ conversation: { id: input.conversationId }, flowRun: { id: input.flowRunId } }, '[agentRpc#updateFlowStepProgress] Refused progress for a run that is not a flow step')
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'Only a flow-step run can report step progress' } })
        }
        const flowRun = await flowRunService(log).getOneOrThrow({ id: input.flowRunId, projectId: conversation.projectId })
        engineRunCallbackService(log).updateStepProgress({
            projectId: conversation.projectId,
            request: { projectId: conversation.projectId, runId: flowRun.id, output: input.output, sequence: input.sequence },
        })
    },

    async resumeFlowStep(input: ResumeFlowStepRequest): Promise<void> {
        const conversation = await agentHelpers.conversationRepo().findOneBy({ id: input.conversationId })
        if (conversation?.source !== AgentRunSource.FLOW_STEP || isNil(conversation.projectId)) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'Only a flow-step run can resume a flow' } })
        }
        const flowRun = await flowRunService(log).getOneOrThrow({ id: input.flowRunId, projectId: conversation.projectId })
        const { stale } = await resumeService(log).resumeFromWaitpoint({
            flowRunId: flowRun.id,
            waitpointId: input.waitpointId,
            resumePayload: { body: sanitizeObjectForPostgresql(input.output), headers: {}, queryParams: {} },
        })
        const resumeFields = { conversation: { id: input.conversationId }, flowRun: { id: flowRun.id }, waitpoint: { id: input.waitpointId } }
        if (stale) {
            log.warn(resumeFields, '[agentRpc#resumeFlowStep] Nothing to resume, so the flow keeps waiting unless another attempt already released it')
            return
        }
        log.info(resumeFields, '[agentRpc#resumeFlowStep] Handed the result back to the flow')
    },

    async executePieceTool(input: ExecutePieceToolRequest): Promise<ExecutePieceToolResponse> {
        const conversation = await agentHelpers.conversationRepo().findOneBy({ id: input.conversationId })
        if (isNil(conversation) || !CONFIGURED_TOOL_SOURCES.includes(conversation.source) || isNil(conversation.projectId)) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'This run is not allowed to run a configured piece tool' } })
        }
        const { projectId, platformId } = conversation
        const model = await agentHelpers.resolveFastModel({ platformId, log, ...spreadIfDefined('provider', input.provider) })
        const { data: run, error: runError } = await tryCatch(() => pieceToolRunner.runFromInstruction({
            model,
            piece: { pieceName: input.piece.pieceName, actionName: input.piece.actionName, pieceVersion: input.piece.pieceVersion },
            instruction: input.instruction,
            projectId,
            platformId,
            log,
            ...spreadIfDefined('predefinedInput', input.piece.predefinedInput),
        }))
        if (!isNil(runError) || isNil(run)) {
            log.error({ error: runError, tool: { name: input.toolName }, piece: { name: input.piece.pieceName, version: input.piece.pieceVersion ?? null }, action: { name: input.piece.actionName } }, '[agentRpc#executePieceTool] Configured action could not run')
            throw runError
        }
        const { result, resolvedInput } = run
        log.info({ conversation: { id: input.conversationId }, tool: { name: input.toolName, input: resolvedInput }, connection: { externalId: input.piece.predefinedInput?.auth }, piece: { name: input.piece.pieceName } }, '[agentRpc#executePieceTool] Ran a configured piece action')
        return { result }
    },

    async executeKnowledgeBaseTool(input: ExecuteKnowledgeBaseToolRequest): Promise<ExecuteKnowledgeBaseToolResponse> {
        const conversation = await agentHelpers.conversationRepo().findOneBy({ id: input.conversationId })
        if (isNil(conversation) || !CONFIGURED_TOOL_SOURCES.includes(conversation.source) || isNil(conversation.projectId)) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'This run is not allowed to search a knowledge base' } })
        }
        const { projectId, platformId } = conversation
        await knowledgeBaseService(log).getFileOrThrow({ projectId, id: input.knowledgeBaseFileId })
        const { model, providerOptions } = await agentHelpers.resolveEmbeddingModel({ platformId, log, ...spreadIfDefined('provider', input.provider) })
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
        const flow = await flowService(log).getOnePopulated({ id: input.flowId, projectId: conversation.projectId })
        if (isNil(flow)) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'That flow is not in this run\'s project' } })
        }
        const result = await runFlowAsTool({ flowId: flow.id, flowDisplayName: flow.version.displayName, payload: input.toolInput, returnsResponse: input.returnsResponse, log })
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
        if (chatOnlyTool && input.source !== AgentRunSource.CHAT) {
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
            log,
        })
        log.debug({ tool: { name: input.toolName, durationMs: Date.now() - startedAt, output: result }, resultBytes: byteLengthOf(result) }, '[agentRpc#executeAgentTool] Tool finished')
        return { result }
    },

    // Security boundary for the chat agent's ap_send_email tool. Recipients may be any valid
    // address (incl. external), but the abuse controls are re-enforced here so a manipulated LLM
    // (e.g. via prompt injection) can't quietly fan out mail on the platform's SMTP reputation:
    // recipient addresses are format-validated, recipient count and per-platform/per-conversation/
    // per-hour volume are capped, and the email is rendered through a branded template with
    // Reply-To set to the real user. The system prompt further constrains the agent to send only
    // on the user's direct request — never because an email instruction appeared in fetched page
    // or tool content.
    async sendAgentEmail(input: SendAgentEmailRequest): Promise<SendAgentEmailResponse> {
        const { conversationId, platformId, userId, to, subject, body } = input

        if (!smtpEmailSender(log).isSmtpConfigured()) {
            return { sent: false, message: 'Email is not configured on this instance.' }
        }

        const conversation = await agentHelpers.getConversationOrThrow({ id: conversationId, platformId, userId })

        if (conversation.source !== AgentRunSource.CHAT) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'Only a chat run can send email' } })
        }

        // Fence the send to the active streaming owner. A run parked on an email approval must not
        // resume and send once it's been superseded (activeRunId changed) OR cancelled/finished
        // (status left STREAMING). Cancellation flips status to IDLE without touching activeRunId,
        // so the status check is what rejects an approved-then-cancelled send.
        const ownsActiveTurn = conversation.status === AgentConversationStatus.STREAMING
            && (isNil(conversation.activeRunId) || conversation.activeRunId === input.runId)
        if (!isNil(input.runId) && !ownsActiveTurn) {
            log.warn({ conversation: { id: conversationId }, run: { id: input.runId }, status: conversation.status }, '[agentRpc#sendAgentEmail] Blocked send from a superseded or cancelled run')
            return { sent: false, message: 'This turn is no longer active, so the email was not sent.' }
        }

        const recipients = unique(to.map((email) => email.toLowerCase().trim()).filter((email) => email.length > 0))
        if (recipients.length === 0) {
            return { sent: false, message: 'No valid recipient email address was provided.' }
        }
        if (recipients.length > MAX_EMAIL_RECIPIENTS) {
            return { sent: false, message: `You can send to at most ${MAX_EMAIL_RECIPIENTS} recipients at once.` }
        }
        const invalidRecipients = recipients.filter((email) => !isLikelyEmailAddress(email))
        if (invalidRecipients.length > 0) {
            return {
                sent: false,
                message: `These are not valid email addresses: ${invalidRecipients.join(', ')}. Provide a real address (e.g. the person's email, or the user's own address for "email me").`,
                blockedRecipients: invalidRecipients,
            }
        }
        if (subject.trim().length === 0) {
            return { sent: false, message: 'The email subject cannot be empty.' }
        }
        if (subject.length > MAX_EMAIL_SUBJECT_LENGTH || body.length > MAX_EMAIL_BODY_LENGTH) {
            return { sent: false, message: 'The email subject or body is too long.' }
        }

        const sender = await userService(log).getMetaInformation({ id: userId })
        const selfEmail = sender.email.toLowerCase().trim()

        // Defense in depth at the SMTP boundary: a recipient other than the user's own address may
        // only be emailed after the user approved this exact tool call. The worker shows an approval
        // card and waits, but the server independently verifies the recorded (user-authenticated)
        // decision, so a prompt-injected or buggy caller can't exfiltrate externally without it.
        const externalRecipients = recipients.filter((email) => email !== selfEmail)
        if (externalRecipients.length > 0) {
            const decision = isNil(input.gateId) ? 'pending' : await agentApprovalGate.checkDecision({ gateId: input.gateId })
            const approved = decision !== 'pending' && decision.approved
                && emailApprovalMatches({ approvedInput: decision.approvedInput, recipients, subject, body })
            if (!approved) {
                log.warn({ conversation: { id: conversationId }, user: { id: userId }, recipientCount: externalRecipients.length }, '[agentRpc#sendAgentEmail] Blocked external send without an approval matching the current recipients/content')
                return { sent: false, message: 'Sending to anyone other than your own address needs your explicit approval first.', blockedRecipients: externalRecipients }
            }
        }

        const conversationLimit = await agentHelpers.incrementAndCheckLimit({ key: `chat-email-count:conv:${platformId}:${conversationId}`, limit: EMAILS_PER_CONVERSATION, ttlSeconds: CONVERSATION_LIMIT_TTL_SECONDS })
        const hourlyLimit = await agentHelpers.incrementAndCheckLimit({ key: `chat-email-count:user:${platformId}:${userId}`, limit: EMAILS_PER_USER_PER_HOUR, ttlSeconds: HOURLY_LIMIT_TTL_SECONDS })
        if (!conversationLimit.allowed || !hourlyLimit.allowed) {
            log.warn({ conversation: { id: conversationId }, user: { id: userId }, conversationCount: conversationLimit.count, hourlyCount: hourlyLimit.count }, '[agentRpc#sendAgentEmail] Email rate limit reached')
            return { sent: false, message: 'You have reached the email sending limit for now. Please try again later.' }
        }

        const senderName = [sender.firstName, sender.lastName].filter((part) => !isNil(part) && part.length > 0).join(' ').trim() || selfEmail

        const { error } = await tryCatch(() => emailService(log).sendChatNotification({
            platformId,
            to: recipients,
            subject,
            body,
            senderName,
            senderEmail: sender.email,
        }))
        if (error) {
            log.error({ error, conversation: { id: conversationId }, user: { id: userId } }, '[agentRpc#sendAgentEmail] Email send failed')
            return { sent: false, message: 'The email could not be sent due to a server error.' }
        }

        log.info({ conversation: { id: conversationId }, user: { id: userId }, recipientCount: recipients.length, subject }, '[agentRpc#sendAgentEmail] Chat notification email sent')
        return { sent: true, message: `Email sent to ${recipients.join(', ')}.` }
    },
})

function isLikelyEmailAddress(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// The approval is only valid for the exact recipients/subject/body the user saw in the preview.
// A different payload reusing an approved gate id (stale/replayed within the TTL) must not pass.
function emailApprovalMatches({ approvedInput, recipients, subject, body }: {
    approvedInput?: Record<string, unknown>
    recipients: string[]
    subject: string
    body: string
}): boolean {
    if (isNil(approvedInput)) {
        return false
    }
    const approvedRecipients = Array.isArray(approvedInput.to)
        ? unique(approvedInput.to.filter((email): email is string => typeof email === 'string').map((email) => email.toLowerCase().trim()))
        : []
    const sameRecipients = approvedRecipients.length === recipients.length && approvedRecipients.every((email) => recipients.includes(email))
    return sameRecipients && approvedInput.subject === subject && approvedInput.body === body
}

async function loadOrStartConversation({ conversationId, platformId, userId, source, projectId, modelName }: {
    conversationId: string
    platformId: string
    userId: string
    source?: AgentRunSource
    projectId?: string | null
    modelName?: string | null
}): Promise<AgentConversation> {
    if (source !== AgentRunSource.FLOW_STEP) {
        return agentHelpers.getConversationOrThrow({ id: conversationId, platformId, userId })
    }
    const existing = await agentHelpers.conversationRepo().findOneBy({ id: conversationId })
    if (!isNil(existing)) {
        if (existing.platformId !== platformId || existing.userId !== userId || existing.source !== AgentRunSource.FLOW_STEP) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'That conversation belongs to someone else' } })
        }
        return existing
    }
    return agentHelpers.conversationRepo().save({
        id: conversationId,
        platformId,
        projectId: projectId ?? null,
        userId,
        source: AgentRunSource.FLOW_STEP,
        title: null,
        modelName: modelName ?? null,
        messages: [],
        status: AgentConversationStatus.IDLE,
    })
}

async function confinedProjectFor({ conversationId }: { conversationId?: string }): Promise<string> {
    const conversation = isNil(conversationId) ? null : await agentHelpers.conversationRepo().findOneBy({ id: conversationId })
    if (isNil(conversation?.projectId)) {
        throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'This run must be confined to a project' } })
    }
    return conversation.projectId
}

function byteLengthOf(value: unknown): number {
    try {
        return Buffer.byteLength(JSON.stringify(value) ?? '', 'utf8')
    }
    catch {
        return -1
    }
}
