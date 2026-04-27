import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
    ActivepiecesError,
    AIProviderName,
    apId,
    ChatConversation,
    ChatHistoryMessage,
    CreateChatConversationRequest,
    ErrorCode,
    isNil,
    SeekPage,
    spreadIfDefined,
    tryCatch,
    UpdateChatConversationRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../ai/ai-provider-service'
import { repoFactory } from '../core/db/repo-factory'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { Order } from '../helper/pagination/paginator'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { mcpServerService } from '../mcp/mcp-service'
import { projectService } from '../project/project-service'
import { ChatConversationEntity } from './chat-conversation-entity'
import { chatSessionCleanup } from './sandbox/postgres-persist-driver'
import { ChatAiConfig, chatSandboxAgent, ChatSandboxConfig } from './sandbox/sandbox-agent'
import { userSandboxService } from './user-sandbox-service'

const conversationRepo = repoFactory(ChatConversationEntity)

const AI_CONFIG_TTL_MS = 5 * 60 * 1000
const aiConfigCache = new Map<string, { config: ChatAiConfig, expiresAt: number }>()

export const chatService = (log: FastifyBaseLogger) => ({
    async createConversation({ projectId, userId, request }: CreateConversationParams): Promise<ChatConversation> {
        return conversationRepo().save({
            id: apId(),
            projectId,
            userId,
            title: request.title ?? null,
            sandboxSessionId: null,
            modelName: request.modelName ?? null,
            summary: null,
        })
    },

    async ensureSession({ id, projectId, userId, platformId }: EnsureSessionParams): Promise<EnsureSessionResult> {
        const conversation = await this.getConversationOrThrow({ id, projectId, userId })
        if (conversation.sandboxSessionId) {
            return { conversation }
        }
        const [aiConfig, mcpCredentials] = await Promise.all([
            this.getChatAiConfig({ platformId, modelName: conversation.modelName }),
            getMcpCredentials({ projectId, log }),
        ])
        const sandboxId = await userSandboxService.getOrCreate({ userId, platformId, aiConfig })
        const { session, sdk } = await chatSandboxAgent.createSession({
            aiConfig,
            sandboxId,
            mcpServerUrl: mcpCredentials.mcpServerUrl,
            mcpToken: mcpCredentials.mcpToken,
        })
        const result = await conversationRepo()
            .createQueryBuilder()
            .update()
            .set({ sandboxSessionId: session.id })
            .where('id = :id AND "sandboxSessionId" IS NULL', { id })
            .execute()
        if (result.affected === 0) {
            await chatSandboxAgent.destroySession({ sessionId: session.id, sandboxId }).catch(() => undefined)
            return { conversation: await this.getConversationOrThrow({ id, projectId, userId }) }
        }
        return {
            conversation: { ...conversation, sandboxSessionId: session.id },
            liveSession: { session, sdk, sandboxId },
        }
    },

    async listConversations({ projectId, userId, cursor, limit }: ListConversationsParams): Promise<SeekPage<ChatConversation>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor)
        const paginator = buildPaginator({
            entity: ChatConversationEntity,
            query: {
                limit,
                orderBy: [
                    { field: 'created', order: Order.DESC },
                    { field: 'id', order: Order.DESC },
                ],
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryBuilder = conversationRepo()
            .createQueryBuilder('chat_conversation')
            .where({ projectId, userId })

        const { data, cursor: paginationCursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage(data, paginationCursor)
    },

    async getConversationOrThrow({ id, projectId, userId }: GetConversationParams): Promise<ChatConversation> {
        const conversation = await conversationRepo().findOneBy({ id, projectId, userId })
        if (isNil(conversation)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: id, entityType: 'ChatConversation' },
            })
        }
        return conversation
    },

    async updateConversation({ id, projectId, userId, request }: UpdateConversationParams): Promise<ChatConversation> {
        const conversation = await this.getConversationOrThrow({ id, projectId, userId })
        const updates = {
            ...spreadIfDefined('title', request.title),
            ...spreadIfDefined('modelName', request.modelName),
        }

        if (Object.keys(updates).length > 0) {
            await conversationRepo().update(conversation.id, updates)
        }
        return { ...conversation, ...updates }
    },

    async cancelSession({ id, projectId, userId }: DeleteConversationParams): Promise<void> {
        const conversation = await this.getConversationOrThrow({ id, projectId, userId })
        const sandboxSessionId = conversation.sandboxSessionId
        if (!sandboxSessionId) return
        await conversationRepo().update(id, { sandboxSessionId: null })
        void destroySessionAndCleanup({ sessionId: sandboxSessionId, userId, log }).catch((err) => {
            log.warn({ err, sessionId: sandboxSessionId }, 'Background session cleanup failed')
        })
    },

    async deleteConversation({ id, projectId, userId }: DeleteConversationParams): Promise<void> {
        const conversation = await this.getConversationOrThrow({ id, projectId, userId })
        const sandboxSessionId = conversation.sandboxSessionId
        await conversationRepo().delete({ id, projectId, userId })
        if (sandboxSessionId) {
            void destroySessionAndCleanup({ sessionId: sandboxSessionId, userId, log }).catch((err) => {
                log.warn({ err, sessionId: sandboxSessionId }, 'Background session cleanup failed')
            })
        }
    },

    async getMessages({ id, projectId, userId }: GetMessagesParams): Promise<{ data: ChatHistoryMessage[] }> {
        const conversation = await this.getConversationOrThrow({ id, projectId, userId })
        const sessionId = conversation.sandboxSessionId
        if (!sessionId) {
            return { data: [] }
        }
        const { data: messages, error: historyError } = await tryCatch(
            async () => chatSandboxAgent.getSessionHistory({ sessionId }),
        )
        if (historyError) {
            log.warn({ err: historyError, conversationId: id }, 'Failed to load session history')
            return { data: [] }
        }
        return { data: messages }
    },

    async getChatAiConfig({ platformId, modelName }: { platformId: string, modelName?: string | null }): Promise<ChatAiConfig> {
        const cached = aiConfigCache.get(platformId)
        if (cached && cached.expiresAt > Date.now()) {
            return { ...cached.config, model: modelName ?? ChatSandboxConfig.model.DEFAULT }
        }
        const config = await resolveChatAiConfig({ platformId, modelName, log })
        aiConfigCache.set(platformId, { config, expiresAt: Date.now() + AI_CONFIG_TTL_MS })
        return config
    },

    isSandboxConfigured(): boolean {
        return Boolean(system.get(AppSystemProp.E2B_API_KEY))
    },

    async buildSystemPrompt({ projectId }: { projectId: string }): Promise<string> {
        const project = await projectService(log).getOneOrThrow(projectId)
        return buildAgentSystemPrompt(project.displayName)
    },
})

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api'

async function resolveChatAiConfig({ platformId, modelName, log }: { platformId: string, modelName?: string | null, log: FastifyBaseLogger }): Promise<ChatAiConfig> {
    const model = modelName ?? ChatSandboxConfig.model.DEFAULT

    const openRouterConfig = await resolveProviderApiKey({ platformId, provider: AIProviderName.ACTIVEPIECES, log })
    if (openRouterConfig) {
        return {
            agent: ChatSandboxConfig.agent.CLAUDE,
            model,
            envs: {
                [ChatSandboxConfig.envVar.ANTHROPIC_API_KEY]: openRouterConfig,
                [ChatSandboxConfig.envVar.ANTHROPIC_BASE_URL]: OPENROUTER_BASE_URL,
            },
        }
    }

    const anthropicApiKey = await resolveProviderApiKey({ platformId, provider: AIProviderName.ANTHROPIC, log })
    if (anthropicApiKey) {
        return {
            agent: ChatSandboxConfig.agent.CLAUDE,
            model,
            envs: {
                [ChatSandboxConfig.envVar.ANTHROPIC_API_KEY]: anthropicApiKey,
            },
        }
    }

    throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { entityId: platformId, entityType: 'ChatAiProvider' },
    })
}

async function destroySessionAndCleanup({ sessionId, userId, log }: {
    sessionId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<void> {
    const sandboxId = await userSandboxService.getSandboxId({ userId })
    if (sandboxId) {
        await chatSandboxAgent.destroySession({ sessionId, sandboxId }).catch((err) => {
            log.warn({ err, sessionId }, 'Failed to destroy E2B session')
        })
    }
    await chatSessionCleanup.deleteSessionData({ sessionId }).catch((err) => {
        log.warn({ err, sessionId }, 'Failed to clean up session data')
    })
}

async function resolveProviderApiKey({ platformId, provider, log }: { platformId: string, provider: AIProviderName, log: FastifyBaseLogger }): Promise<string | null> {
    const { data: config } = await tryCatch(
        async () => aiProviderService(log).getConfigOrThrow({ platformId, provider }),
    )
    if (config && 'apiKey' in config.auth && config.auth.apiKey) {
        return config.auth.apiKey
    }
    return null
}

async function getMcpCredentials({ projectId, log }: { projectId: string, log: FastifyBaseLogger }): Promise<{ mcpServerUrl: string | null, mcpToken: string | null }> {
    const { data: mcpServer, error } = await tryCatch(async () => mcpServerService(log).getByProjectId(projectId))
    if (error) {
        return { mcpServerUrl: null, mcpToken: null }
    }
    const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
    const mcpServerUrl = `${frontendUrl}/mcp`
    if (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
        log.warn({ mcpServerUrl }, 'MCP server URL points to localhost — the sandbox agent (E2B) cannot reach it. Set AP_FRONTEND_URL to a public URL (e.g. ngrok tunnel) for MCP tools to work.')
    }
    return {
        mcpServerUrl,
        mcpToken: mcpServer.token,
    }
}

function sanitizeProjectName(name: string): string {
    return name.replace(/["`<>\\\r\n]/g, '').slice(0, 64)
}

const SYSTEM_PROMPT_TEMPLATE = readFileSync(
    path.resolve('packages/server/api/src/assets/prompts/chat-system-prompt.md'),
    'utf8',
)

function buildAgentSystemPrompt(projectName: string): string {
    return SYSTEM_PROMPT_TEMPLATE.replace('{{PROJECT_NAME}}', sanitizeProjectName(projectName))
}

type CreateConversationParams = {
    projectId: string
    userId: string
    request: CreateChatConversationRequest
}

type ListConversationsParams = {
    projectId: string
    userId: string
    cursor?: string
    limit: number
}

type GetConversationParams = {
    id: string
    projectId: string
    userId: string
}

type UpdateConversationParams = {
    id: string
    projectId: string
    userId: string
    request: UpdateChatConversationRequest
}

type EnsureSessionParams = {
    id: string
    projectId: string
    userId: string
    platformId: string
}

type EnsureSessionResult = {
    conversation: ChatConversation
    liveSession?: {
        session: import('sandbox-agent').Session
        sdk: import('sandbox-agent').SandboxAgent
        sandboxId: string
    }
}

type DeleteConversationParams = {
    id: string
    projectId: string
    userId: string
    platformId: string
}

type GetMessagesParams = {
    id: string
    projectId: string
    userId: string
}
