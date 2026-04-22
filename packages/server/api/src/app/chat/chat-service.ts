import {
    ActivepiecesError,
    AIProviderName,
    apId,
    ChatConversation,
    CreateChatConversationRequest,
    ErrorCode,
    isNil,
    SeekPage,
    UpdateChatConversationRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../ai/ai-provider-service'
import { repoFactory } from '../core/db/repo-factory'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { mcpServerService } from '../mcp/mcp-service'
import { ChatConversationEntity } from './chat-conversation-entity'
import { chatSandboxAgent } from './chat-sandbox-agent'

const conversationRepo = repoFactory(ChatConversationEntity)

export const chatService = (log: FastifyBaseLogger) => ({
    async createConversation({ projectId, userId, platformId, request }: CreateConversationParams): Promise<ChatConversation> {
        const [anthropicApiKey, { mcpServerUrl, mcpToken }] = await Promise.all([
            getAnthropicApiKey({ platformId, log }),
            getMcpCredentials({ projectId, log }),
        ])

        const session = await chatSandboxAgent.createSession({
            anthropicApiKey,
            mcpServerUrl,
            mcpToken,
        })

        try {
            const saved = await conversationRepo().save({
                id: apId(),
                projectId,
                userId,
                title: request.title ?? null,
                sandboxSessionId: session.id,
                modelName: request.modelName ?? null,
                totalInputTokens: 0,
                totalOutputTokens: 0,
                summary: null,
            })
            return saved
        }
        catch (err) {
            await chatSandboxAgent.destroySession({ sessionId: session.id, anthropicApiKey }).catch(() => { /* best-effort cleanup */ })
            throw err
        }
    },

    async listConversations({ projectId, userId, cursor, limit }: ListConversationsParams): Promise<SeekPage<ChatConversation>> {
        const queryBuilder = conversationRepo()
            .createQueryBuilder('c')
            .where('c.projectId = :projectId', { projectId })
            .andWhere('c.userId = :userId', { userId })
            .orderBy('c.created', 'DESC')
            .take(limit + 1)

        if (!isNil(cursor)) {
            queryBuilder.andWhere('c.created < (SELECT cc.created FROM chat_conversation cc WHERE cc.id = :cursor AND cc.projectId = :projectId AND cc.userId = :userId)', { cursor })
        }

        const results = await queryBuilder.getMany()
        const hasMore = results.length > limit
        const data = hasMore ? results.slice(0, limit) : results

        return {
            data,
            next: hasMore ? data[data.length - 1].id : null,
            previous: null,
        }
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
        const updates: Partial<Pick<ChatConversation, 'title' | 'modelName'>> = {}
        if (request.title !== undefined) updates.title = request.title
        if (request.modelName !== undefined) updates.modelName = request.modelName

        if (Object.keys(updates).length > 0) {
            await conversationRepo().update(conversation.id, updates)
        }
        return { ...conversation, ...updates }
    },

    async deleteConversation({ id, projectId, userId, platformId }: DeleteConversationParams): Promise<void> {
        const conversation = await this.getConversationOrThrow({ id, projectId, userId })
        if (conversation.sandboxSessionId) {
            const anthropicApiKey = await getAnthropicApiKey({ platformId, log })
            await chatSandboxAgent.destroySession({ sessionId: conversation.sandboxSessionId, anthropicApiKey }).catch(() => { /* session may already be gone */ })
        }
        await conversationRepo().delete({ id, projectId })
    },

    async updateTokenUsage({ conversationId, projectId, inputTokens, outputTokens }: UpdateTokenUsageParams): Promise<void> {
        const safeInput = Number.isFinite(inputTokens) ? inputTokens : 0
        const safeOutput = Number.isFinite(outputTokens) ? outputTokens : 0
        await conversationRepo()
            .createQueryBuilder()
            .update()
            .set({
                totalInputTokens: () => '"totalInputTokens" + :safeInput',
                totalOutputTokens: () => '"totalOutputTokens" + :safeOutput',
            })
            .setParameters({ safeInput, safeOutput })
            .where('id = :id AND "projectId" = :projectId', { id: conversationId, projectId })
            .execute()
    },

    async updateSummary({ conversationId, projectId, summary }: UpdateSummaryParams): Promise<void> {
        await conversationRepo().update({ id: conversationId, projectId }, { summary })
    },
})

async function getMcpCredentials({ projectId, log }: { projectId: string, log: FastifyBaseLogger }): Promise<{ mcpServerUrl: string | null, mcpToken: string | null }> {
    try {
        const mcpServer = await mcpServerService(log).getByProjectId(projectId)
        const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
        return {
            mcpServerUrl: `${frontendUrl}/api/v1/projects/${projectId}/mcp-server/http`,
            mcpToken: mcpServer.token,
        }
    }
    catch {
        return { mcpServerUrl: null, mcpToken: null }
    }
}

async function getAnthropicApiKey({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<string> {
    const config = await aiProviderService(log).getConfigOrThrow({
        platformId,
        provider: AIProviderName.ANTHROPIC,
    })
    return config.auth.apiKey
}

type CreateConversationParams = {
    projectId: string
    userId: string
    platformId: string
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

type DeleteConversationParams = {
    id: string
    projectId: string
    userId: string
    platformId: string
}

type UpdateTokenUsageParams = {
    conversationId: string
    projectId: string
    inputTokens: number
    outputTokens: number
}

type UpdateSummaryParams = {
    conversationId: string
    projectId: string
    summary: string
}
