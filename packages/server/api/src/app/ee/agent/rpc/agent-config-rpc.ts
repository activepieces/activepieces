import { ActivepiecesError, ErrorCode, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { AgentConfigResponse, AgentConversationStatus, AgentRunSource, GetAgentConfigRequest, GetEnabledAiToolsResponse, PersistedAgentMessage, PersistedAgentPartType, PersistedAgentRole } from '@activepieces/shared'
import { ModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { agentApprovalGate } from '.././agent-approval-gate'
import { agentCompaction } from '.././agent-compaction'
import { buildAttachmentNote, buildUserContentWithFiles, persistAgentAttachments } from '.././agent-file-utils'
import { agentHelpers } from '.././agent-helpers'
import { agentMcp } from '.././mcp/agent-mcp'
import { chatPersonalizationService } from '.././personalization/chat-personalization-service'
import { agentPrompt } from '.././prompt/agent-prompt'
import { agentSurfaceNotes } from '.././prompt/agent-surface-notes'
import { UserIdentity } from '.././prompt/agent-user-identity'
import { aiToolConfigService } from '../../../ai/ai-tool-config-service'
import { appConnectionService } from '../../../app-connection/app-connection-service/app-connection-service'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { platformService } from '../../../platform/platform.service'
import { userService } from '../../../user/user-service'
import { smtpEmailSender } from '../../helper/email/email-sender/smtp-email-sender'

import { CONNECTION_INVENTORY_LIMIT, loadOrStartConversation } from './rpc-shared'


export const agentConfigRpc = (log: FastifyBaseLogger) => ({
    async getAgentConfig(input: GetAgentConfigRequest): Promise<AgentConfigResponse> {
        const { conversationId, platformId, userId, userMessage, modelName, files, promptOverride, dryRun, discoveryOnly, source: requestedSource, projectId: requestedProjectId } = input

        // A flow-step run gets none of the owner's chat context, so it is not fetched. Reading it
        // anyway meant an owner without an MCP token or a user record failed the run outright.
        const isFlowStep = requestedSource === AgentRunSource.FLOW_STEP
        // A saved agent answers from its own instructions, so one person's remembered preferences
        // must not change how it behaves for everyone else who talks to it.
        const isBuilder = requestedSource === AgentRunSource.AGENT_BUILDER
        const carriesChatContext = requestedSource !== AgentRunSource.FLOW_STEP && requestedSource !== AgentRunSource.AGENT && !isBuilder

        const [conversation, userProjects, enabledAiTools] = await Promise.all([
            loadOrStartConversation({ conversationId, platformId, userId, source: requestedSource, projectId: requestedProjectId, modelName }),
            agentHelpers.getUserProjects({ platformId, userId, log }),
            aiToolConfigService(log).getEnabledTools({ platformId }),
        ])

        const [scopedMcpCredentials, runMemory, runUser, platformResult, identityResult] = await Promise.all([
            carriesChatContext || isBuilder ? agentMcp.getCredentials({ platformId, userId, log }) : { mcpServerUrl: null, mcpToken: null },
            carriesChatContext ? agentHelpers.getUserMemory({ platformId, userId }) : { instructions: null, memories: [] as string[] },
            carriesChatContext ? userService(log).getMetaInformation({ id: userId }) : null,
            carriesChatContext ? tryCatch(() => platformService(log).getOneOrThrow(platformId)) : null,
            carriesChatContext ? tryCatch(() => chatPersonalizationService(log).getIdentityEnrichment({ platformId, userId })) : null,
        ])
        const runUserEmail = runUser?.email ?? ''
        const userIdentity: UserIdentity | null = isNil(runUser)
            ? null
            : {
                firstName: runUser.firstName,
                lastName: runUser.lastName,
                email: runUser.email,
                platformName: platformResult && !platformResult.error ? platformResult.data.name : null,
                identity: identityResult && !identityResult.error ? identityResult.data : null,
            }

        if (isFlowStep !== (conversation.source === AgentRunSource.FLOW_STEP)) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'The run asked for a different surface than the conversation it belongs to' } })
        }

        const scopedProjects = conversation.source === AgentRunSource.FLOW_STEP
            ? userProjects.filter((p) => p.id === conversation.projectId)
            : userProjects

        const validCandidateProjectId = conversation.projectId && scopedProjects.some((p) => p.id === conversation.projectId)
            ? conversation.projectId
            : null
        // Default to the user's first project when none is chosen so the agent never hits a cold
        // "No project selected" on the first data tool. The chat MCP server resolves its project
        // from conversation.projectId per request, so persist it below (the user can switch via the
        // dropdown / ap_select_project, which overwrites this).
        const selectedProjectId = agentHelpers.selectRunProject({ conversationProjectId: conversation.projectId ?? null, projects: scopedProjects })

        // Settled before the provider is resolved: the turn runs inside this project, so the
        // credential has to be chosen for it. Resolving earlier, while the project was still
        // unknown, is what let a projectless conversation pick a key scoped away from the project
        // it then adopted. A flow step reads its own conversation's project rather than the
        // selection above, which narrows to what the owner can still see in chat.
        const runProjectId = isFlowStep ? conversation.projectId ?? null : selectedProjectId
        const providerConfig = await agentHelpers.resolveRunProvider({ platformId, log, scope: agentHelpers.runScopeOrThrow({ projectId: runProjectId }), ...spreadIfDefined('provider', input.provider), ...spreadIfDefined('providerConfigId', input.providerConfigId) })

        const attachmentRefs = files && files.length > 0 && !isNil(selectedProjectId)
            ? await persistAgentAttachments({ files, projectId: selectedProjectId, platformId, log })
            : []
        const userContent = await buildUserContentWithFiles({ text: userMessage, files, attachmentNote: buildAttachmentNote(attachmentRefs) })

        const aiTools: GetEnabledAiToolsResponse = dryRun ? {} : enabledAiTools
        const actingRun = !dryRun && !discoveryOnly
        const emailEnabled = actingRun && carriesChatContext && smtpEmailSender(log).isSmtpConfigured()
        const agentsAvailable = actingRun && (carriesChatContext || isBuilder) && await agentHelpers.agentsSurfaceAvailable({ platformId, log })
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

        if (!dryRun && isNil(validCandidateProjectId) && !isNil(selectedProjectId)) {
            await agentHelpers.conversationRepo().update(conversationId, { projectId: selectedProjectId })
        }

        const selectedModel = modelName ?? conversation.modelName ?? null
        // The tier resolver finds no tier for a concrete model id and silently returns the default,
        // so a source that names its own model must never be routed through it.
        const namesItsOwnModel = requestedSource === AgentRunSource.FLOW_STEP || requestedSource === AgentRunSource.AGENT
        const tier = agentHelpers.resolveTier({ tierId: namesItsOwnModel ? null : selectedModel })
        const resolvedModelId = namesItsOwnModel && !isNil(modelName)
            ? agentHelpers.resolveNamedModelId({ provider: providerConfig.provider, modelName, modelScope: providerConfig.modelScope, modelIds: providerConfig.modelIds })
            : agentHelpers.resolveModelIdForProvider({ provider: providerConfig.provider, selectedModel, config: providerConfig.config, modelScope: providerConfig.modelScope, modelIds: providerConfig.modelIds })

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
            ...spreadIfDefined('messageSource', input.messageSource),
            currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
            searchAvailable: webSearchAvailable,
            fetchAvailable,
            scrapeAvailable: fetchAvailable && !isNil(aiTools.webScraping),
            imageAvailable: actingRun && !isNil(aiTools.imageGeneration),
            emailAvailable: emailEnabled,
            agentsAvailable,
            userEmail: runUserEmail,
            userIdentity,
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
            providerConfigId: providerConfig.configId,
            auth: providerConfig.auth as Record<string, unknown>,
            providerConfig: providerConfig.config as Record<string, unknown>,
            modelId: resolvedModelId,
            fastModelId: agentHelpers.resolveFastModelId({ provider: providerConfig.provider, config: providerConfig.config, modelScope: providerConfig.modelScope, modelIds: providerConfig.modelIds }),
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
            agentsAvailable,
            userEmail: runUserEmail,
            source: conversation.source,
        }
    },

})
