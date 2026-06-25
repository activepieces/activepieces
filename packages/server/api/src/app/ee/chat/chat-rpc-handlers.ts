import { ActivepiecesError, ErrorCode, isNil, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
import { chatAiUtils } from '@activepieces/server-utils'
import { ChatConfigResponse, ChatConversationStatus, chatToolClassification, ExecuteChatToolRequest, ExecuteChatToolResponse, FileCompression, FileType, FlowActionType, flowStructureUtil, GetChatConfigRequest, GetEnabledAiToolsResponse, HeartbeatChatConversationRequest, PersistedChatMessage, PersistedChatPartType, PersistedChatRole, SaveChatFileRequest, SaveChatFileResponse, SaveChatMessagesRequest, UpdateChatProgressRequest, UpdateProjectContextRequest } from '@activepieces/shared'
import { ModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { aiToolConfigService } from '../../ai/ai-tool-config-service'
import { fileService } from '../../file/file.service'
import { filesService } from '../../file/files-service'
import { flowService } from '../../flows/flow/flow.service'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { chatApprovalGate } from './chat-approval-gate'
import { chatCompaction } from './chat-compaction'
import { buildAttachmentNote, buildUserContentWithFiles, persistChatAttachments } from './chat-file-utils'
import { chatHelpers } from './chat-helpers'
import { chatAnalyticsTelemetry } from './chat-sync-job'
import { chatMcp } from './mcp/chat-mcp'
import { chatPrompt } from './prompt/chat-prompt'
import { executeCrossProjectTool } from './tools/chat-tools'

const MAX_APPROVAL_BLOCK_MS = 50_000

// A conversation row is owned by a single active run at a time. A turn that was
// preempted by a newer message (or otherwise superseded) must never write back:
// its in-flight snapshot is stale and would clobber the run that now owns the
// row. Returns true only when both an active run and the caller's runId are
// present and they differ — missing either side is treated as "not stale" so
// older callers stay backward-compatible.
async function isStaleRun({ conversationId, runId }: { conversationId: string, runId?: string }): Promise<boolean> {
    if (isNil(runId)) {
        return false
    }
    const activeRunId = await chatApprovalGate.getActiveRunId({ conversationId })
    if (isNil(activeRunId)) {
        return false
    }
    return activeRunId !== runId
}

function buildCapabilitiesNote({ currentDate, searchAvailable, fetchAvailable, scrapeAvailable, imageAvailable }: {
    currentDate: string
    searchAvailable: boolean
    fetchAvailable: boolean
    scrapeAvailable: boolean
    imageAvailable: boolean
}): string {
    const lines: string[] = ['\n\n## Capabilities (current session)']

    lines.push(`- **Today's date**: ${currentDate}. Use this for anything time-relative — and when you add a year to a search query to get recent results, take it from here. Never assume the year from memory; your training is stale and will be wrong.`)

    if (searchAvailable) {
        lines.push('- **Web search** (`ap_web_search`): search the live web for current, factual, or up-to-date information. Prefer it whenever the answer depends on recent or external knowledge.')
    }
    else {
        lines.push('- **Web search**: NOT available — do not claim to have searched the web.')
    }

    if (scrapeAvailable) {
        lines.push('- **Web scraping** (`ap_scrape_url`): extract the full clean content of a page as markdown (handles JS-rendered pages). Use it when you need the complete content of a page; use `ap_fetch_url` only for a quick lightweight read.')
    }
    else if (fetchAvailable) {
        lines.push('- **Read a URL** (`ap_fetch_url`): read a specific page as text. No dedicated scraper is configured.')
    }
    else {
        lines.push('- **URL reading**: NOT available — do not claim to fetch or scrape URLs.')
    }

    if (imageAvailable) {
        lines.push('- **Image generation** (`ap_generate_image`): create images from a text prompt. Choose `style`: "realistic" for photos, "graphic_text" for social/email/marketing graphics with readable text, "brand_vector" for logos/icons/vector graphics, "abstract" for artistic/background images. Pass a short, fun, task-specific `caption` for the card. The image is shown to the user automatically — never paste the image URL into your reply.')
    }

    return lines.join('\n')
}

export const chatRpcHandlers = (log: FastifyBaseLogger) => ({
    async getChatConfig(input: GetChatConfigRequest): Promise<ChatConfigResponse> {
        const { conversationId, platformId, userId, userMessage, modelName, files, promptOverride, dryRun } = input

        const [conversation, providerConfig, userProjects, mcpCredentials, enabledAiTools] = await Promise.all([
            chatHelpers.getConversationOrThrow({ id: conversationId, platformId, userId }),
            chatHelpers.resolveChatProvider({ platformId, log }),
            chatHelpers.getUserProjects({ platformId, userId, log }),
            chatMcp.getCredentials({ platformId, userId, log }),
            aiToolConfigService(log).getEnabledTools({ platformId }),
        ])

        const attachmentProjectId = (conversation.projectId && userProjects.some((p) => p.id === conversation.projectId))
            ? conversation.projectId
            : userProjects[0]?.id
        const attachmentRefs = files && files.length > 0 && !isNil(attachmentProjectId)
            ? await persistChatAttachments({ files, projectId: attachmentProjectId, platformId, log })
            : []
        const userContent = await buildUserContentWithFiles({ text: userMessage, files, attachmentNote: buildAttachmentNote(attachmentRefs) })

        const aiTools: GetEnabledAiToolsResponse = dryRun ? {} : enabledAiTools
        const fetchAvailable = !dryRun
        // Tavily takes precedence over native LLM search; native is only the no-Tavily fallback.
        const tavilySearchAvailable = !isNil(aiTools.webSearch)
        const webSearchAvailable = fetchAvailable && (tavilySearchAvailable || chatAiUtils.supportsWebSearch(providerConfig.provider))

        const lockResult = await chatHelpers.conversationRepo()
            .createQueryBuilder()
            .update()
            .set({ status: ChatConversationStatus.STREAMING })
            .where('id = :id AND status != :streaming', { id: conversationId, streaming: ChatConversationStatus.STREAMING })
            .execute()
        if (lockResult.affected === 0) {
            log.warn({ conversation: { id: conversationId } }, '[chatRpc#getChatConfig] Concurrent run rejected (conversation already STREAMING)')
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'An agent is already running for this conversation' },
            })
        }

        const candidateProjectId = conversation.projectId ?? null
        const selectedProjectId = candidateProjectId && userProjects.some((p) => p.id === candidateProjectId)
            ? candidateProjectId
            : null

        const tier = chatHelpers.resolveTier({ tierId: modelName ?? conversation.modelName ?? null })
        const resolvedModelId = chatHelpers.resolveModelIdForProvider({ tier, provider: providerConfig.provider })

        const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
        const systemPromptText = chatPrompt.buildSystemPrompt({
            projects: userProjects,
            currentProjectId: selectedProjectId,
            frontendUrl,
            templates: promptOverride,
        }) + buildCapabilitiesNote({
            currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
            searchAvailable: webSearchAvailable,
            fetchAvailable,
            scrapeAvailable: fetchAvailable && !isNil(aiTools.webScraping),
            imageAvailable: fetchAvailable && !isNil(aiTools.imageGeneration),
        })
        // Merge over defaults, not replace: an override carries only the changed guide topics
        // (the eval fix-flow sends a partial), so a bare assignment would drop every other guide.
        const guides = promptOverride?.guides
            ? { ...chatPrompt.guides, ...promptOverride.guides }
            : chatPrompt.guides

        const previousMessages = conversation.messages as ModelMessage[]
        const newUserMessage: ModelMessage = { role: 'user' as const, content: userContent }
        const allMessages = [...previousMessages, newUserMessage]
        const llmHistory = chatAiUtils.collapseStaleToolOutputs({ messages: allMessages })

        const previousUiMessages = (conversation.uiMessages ?? []) as PersistedChatMessage[]
        const uiMessagesWithUser: PersistedChatMessage[] = [
            ...previousUiMessages,
            { role: PersistedChatRole.USER, parts: [{ type: PersistedChatPartType.TEXT, text: userMessage }] },
        ]
        await chatHelpers.conversationRepo().update(conversationId, {
            messages: allMessages,
            uiMessages: JSON.parse(JSON.stringify(uiMessagesWithUser)),
        })
        await chatApprovalGate.clearCancel({ conversationId })

        const estimatedTokens = chatCompaction.estimateTokenCount({ messages: llmHistory, systemPromptLength: systemPromptText.length })
        let compactionState = { summary: conversation.summary ?? null, summarizedUpToIndex: conversation.summarizedUpToIndex ?? null }

        const willCompact = chatCompaction.shouldCompact({ estimatedTokens, provider: providerConfig.provider, messageCount: llmHistory.length })
        log.debug({ estimatedTokens, willCompact, messageCount: llmHistory.length, systemPromptLength: systemPromptText.length }, '[chatRpc#getChatConfig] Compaction decision')
        if (willCompact) {
            const model = chatAiUtils.createChatModel({
                provider: providerConfig.provider,
                auth: providerConfig.auth as Record<string, unknown>,
                config: providerConfig.config as Record<string, unknown>,
                modelId: resolvedModelId,
            })
            compactionState = await chatCompaction.compactMessages({
                messages: llmHistory,
                existingSummary: compactionState.summary,
                summarizedUpToIndex: compactionState.summarizedUpToIndex,
                provider: providerConfig.provider,
                model,
                log,
            })
            await chatHelpers.conversationRepo().update(conversationId, {
                summary: compactionState.summary,
                summarizedUpToIndex: compactionState.summarizedUpToIndex,
            })
            log.info({ summarizedUpToIndex: compactionState.summarizedUpToIndex, summaryLength: compactionState.summary?.length ?? 0 }, '[chatRpc#getChatConfig] Compaction ran')
        }

        const messagesForLlm = chatCompaction.buildCompactedPayload({
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
        }, '[chatRpc#getChatConfig] Chat config resolved')
        log.debug({ systemPrompt: systemPromptText, guideNames: Object.keys(guides) }, '[chatRpc#getChatConfig] System prompt assembled')

        return {
            provider: providerConfig.provider,
            auth: providerConfig.auth as Record<string, unknown>,
            providerConfig: providerConfig.config as Record<string, unknown>,
            modelId: resolvedModelId,
            fastModelId: chatHelpers.resolveFastModelId({ provider: providerConfig.provider }),
            systemPrompt: systemPromptText,
            messages: messagesForLlm,
            allMessages,
            previousUiMessages: uiMessagesWithUser,
            tier: { id: tier.id, thinkingBudget: tier.thinkingBudget, modelId: tier.modelId },
            mcpCredentials: mcpCredentials.mcpServerUrl && mcpCredentials.mcpToken
                ? { mcpServerUrl: mcpCredentials.mcpServerUrl, mcpToken: mcpCredentials.mcpToken }
                : null,
            projects: userProjects.map((p) => ({ id: p.id, displayName: p.displayName, type: p.type })),
            guides,
            aiTools,
        }
    },

    async saveChatFile(input: SaveChatFileRequest): Promise<SaveChatFileResponse> {
        const conversation = await chatHelpers.conversationRepo().findOneBy({
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

    async saveChatMessages(input: SaveChatMessagesRequest): Promise<void> {
        if (await isStaleRun({ conversationId: input.conversationId, runId: input.runId })) {
            log.info({ conversation: { id: input.conversationId }, run: { id: input.runId } }, '[chatRpc#saveChatMessages] Skipped write from superseded run')
            return
        }
        const isSuccessfulCompletion = input.messages.length > 0
        const updates: Record<string, unknown> = {
            status: isSuccessfulCompletion ? ChatConversationStatus.IDLE : ChatConversationStatus.ERROR,
        }

        if (isSuccessfulCompletion) {
            updates.messages = input.messages
            updates.uiMessages = sanitizeObjectForPostgresql(input.uiMessages)
            if (input.title) updates.title = input.title
            if (input.modelName) updates.modelName = input.modelName
        }

        const saveResult = await chatHelpers.conversationRepo().update(input.conversationId, updates)
        if (saveResult.affected === 0) {
            log.warn({ conversation: { id: input.conversationId } }, 'saveChatMessages: conversation not found, may have been deleted')
        }
        log.info({
            conversation: { id: input.conversationId },
            messageCount: input.messages.length,
            uiMessageCount: input.uiMessages.length,
            status: updates.status,
            titlePresent: !isNil(input.title),
        }, '[chatRpc#saveChatMessages] Conversation persisted')

        if (input.messages.length > 0) {
            const conversation = await chatHelpers.conversationRepo().findOneBy({ id: input.conversationId })
            if (conversation) {
                chatAnalyticsTelemetry(log).sendConversationUpdate({ conversation })
                chatAnalyticsTelemetry(log).sendMessageBillingEvent({ conversation })
            }
        }
    },

    async updateChatProgress(input: UpdateChatProgressRequest): Promise<void> {
        if (await isStaleRun({ conversationId: input.conversationId, runId: input.runId })) {
            log.debug({ conversation: { id: input.conversationId }, run: { id: input.runId } }, '[chatRpc#updateChatProgress] Skipped write from superseded run')
            return
        }
        await chatHelpers.conversationRepo().update(input.conversationId, {
            uiMessages: JSON.parse(JSON.stringify(input.uiMessages)),
        })
        log.debug({ conversation: { id: input.conversationId }, uiMessageCount: input.uiMessages.length }, '[chatRpc#updateChatProgress] Progress persisted')
    },

    async heartbeatChatConversation(input: HeartbeatChatConversationRequest): Promise<void> {
        if (await isStaleRun({ conversationId: input.conversationId, runId: input.runId })) {
            return
        }
        // Liveness signal from the still-running worker. Bumping `updated` only while the row
        // is STREAMING keeps the passive stale-recovery in getConversationOrThrow from flipping
        // a genuinely-working long turn to IDLE; once the worker stops heartbeating (finished,
        // cancelled, or dead) the row goes stale and recovery reclaims it within the timeout.
        await chatHelpers.conversationRepo()
            .createQueryBuilder()
            .update()
            .set({ updated: () => 'now()' })
            .where('id = :id AND status = :streaming', { id: input.conversationId, streaming: ChatConversationStatus.STREAMING })
            .execute()
    },

    async updateProjectContext(input: UpdateProjectContextRequest): Promise<void> {
        await chatHelpers.conversationRepo().update(input.conversationId, { projectId: input.projectId })
        log.info({ conversation: { id: input.conversationId }, project: input.projectId ? { id: input.projectId } : undefined }, '[chatRpc#updateProjectContext] Project context updated')
    },

    async executeChatTool(input: ExecuteChatToolRequest): Promise<ExecuteChatToolResponse> {
        if (input.toolName === '__cancel_check') {
            const conversationId = input.toolInput.conversationId
            if (typeof conversationId !== 'string') {
                return { result: false }
            }
            const runId = typeof input.toolInput.runId === 'string' ? input.toolInput.runId : undefined
            if (runId) {
                const currentRunId = await chatApprovalGate.getActiveRunId({ conversationId })
                if (currentRunId === runId) {
                    await chatApprovalGate.storeActiveRunId({ conversationId, runId })
                }
            }
            const cancelled = await chatApprovalGate.isCancelled({ conversationId, runId })
            return { result: cancelled }
        }
        if (input.toolName === '__approval_wait') {
            const gateId = input.toolInput.gateId
            if (typeof gateId !== 'string') {
                return { result: 'pending' }
            }
            const rawTimeout = input.toolInput.timeoutMs
            const timeoutMs = Math.min(typeof rawTimeout === 'number' ? rawTimeout : MAX_APPROVAL_BLOCK_MS, MAX_APPROVAL_BLOCK_MS)
            const decision = await chatApprovalGate.waitForDecision({ gateId, timeoutMs })
            return { result: decision }
        }
        if (input.toolName === '__store_pending_gate') {
            const { conversationId: convId, gateId, toolName: gateTool, displayName, toolInput: gateInput } = input.toolInput
            if (typeof convId === 'string' && typeof gateId === 'string' && typeof gateTool === 'string') {
                await chatApprovalGate.storePendingGate({
                    conversationId: convId,
                    gate: {
                        gateId,
                        toolName: gateTool,
                        displayName: typeof displayName === 'string' ? displayName : gateTool,
                        toolInput: typeof gateInput === 'object' && gateInput !== null ? gateInput as Record<string, unknown> : {},
                    },
                })
            }
            return { result: { success: true } }
        }
        if (input.toolName === '__store_selected_connection') {
            const { pieceName, connectionExternalId, label, projectId } = input.toolInput
            if (typeof input.conversationId === 'string' && typeof pieceName === 'string' && typeof connectionExternalId === 'string') {
                await chatApprovalGate.storeSelectedConnection({
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
            const conversation = await chatHelpers.getConversationOrThrow({ id: input.conversationId, platformId: input.platformId, userId: input.userId })
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
                    && chatToolClassification.isWriteActionName(step.settings.actionName))
                .map((step) => step.displayName)
            log.info({ flow: { id: flowId }, hasWrites: writeSteps.length > 0, writeStepCount: writeSteps.length }, '[chatRpc#executeChatTool] Flow write check')
            return { result: { hasWrites: writeSteps.length > 0, flowName: flow.version.displayName, writeSteps } }
        }
        if (input.toolName === '__get_available_connections') {
            const { pieceName } = input.toolInput
            if (typeof input.conversationId === 'string' && typeof pieceName === 'string') {
                const connections = await chatApprovalGate.getAvailableConnections({ conversationId: input.conversationId, pieceName })
                return { result: connections }
            }
            return { result: [] }
        }

        log.debug({ tool: { name: input.toolName, input: input.toolInput } }, '[chatRpc#executeChatTool] Tool invoke')
        const startedAt = Date.now()
        const result = await executeCrossProjectTool({
            toolName: input.toolName,
            toolInput: input.toolInput,
            platformId: input.platformId,
            userId: input.userId,
            conversationId: input.conversationId,
            log,
        })
        log.debug({ tool: { name: input.toolName, durationMs: Date.now() - startedAt, output: result }, resultBytes: byteLengthOf(result) }, '[chatRpc#executeChatTool] Tool finished')
        return { result }
    },
})

function byteLengthOf(value: unknown): number {
    try {
        return Buffer.byteLength(JSON.stringify(value) ?? '', 'utf8')
    }
    catch {
        return -1
    }
}
