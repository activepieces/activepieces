import {
    ActivepiecesError,
    apId,
    ChatConversation,
    ChatMessage,
    ChatMessageRole,
    CreateChatConversationRequest,
    ErrorCode,
    isNil,
    SeekPage,
    TokenUsage,
    ToolCallRecord,
    UpdateChatConversationRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { ChatConversationEntity, ChatMessageEntity } from './chat-entity'

const conversationRepo = repoFactory(ChatConversationEntity)
const messageRepo = repoFactory(ChatMessageEntity)

export const chatService = (_log: FastifyBaseLogger) => ({
    async createConversation({ projectId, userId, request }: CreateConversationParams): Promise<ChatConversation> {
        return conversationRepo().save({
            id: apId(),
            projectId,
            userId,
            title: request.title ?? null,
            modelProvider: request.modelProvider ?? null,
            modelName: request.modelName ?? null,
        }) as Promise<ChatConversation>
    },

    async listConversations({ projectId, userId, cursor, limit }: ListConversationsParams): Promise<SeekPage<ChatConversation>> {
        const queryBuilder = conversationRepo()
            .createQueryBuilder('c')
            .where('c.projectId = :projectId', { projectId })
            .andWhere('c.userId = :userId', { userId })
            .orderBy('c.created', 'DESC')
            .take(limit + 1)

        if (!isNil(cursor)) {
            queryBuilder.andWhere('c.created < (SELECT cc.created FROM chat_conversation cc WHERE cc.id = :cursor)', { cursor })
        }

        const results = await queryBuilder.getMany()
        const hasMore = results.length > limit
        const data = hasMore ? results.slice(0, limit) : results

        return {
            data: data as ChatConversation[],
            next: hasMore ? data[data.length - 1].id : null,
            previous: null,
        }
    },

    async getConversation({ id, projectId }: GetConversationParams): Promise<ChatConversation | null> {
        return conversationRepo().findOneBy({ id, projectId }) as Promise<ChatConversation | null>
    },

    async getConversationOrThrow({ id, projectId }: GetConversationParams): Promise<ChatConversation> {
        const conversation = await this.getConversation({ id, projectId })
        if (isNil(conversation)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: id, entityType: 'ChatConversation' },
            })
        }
        return conversation
    },

    async updateConversation({ id, projectId, request }: UpdateConversationParams): Promise<ChatConversation> {
        const conversation = await this.getConversationOrThrow({ id, projectId })
        const updates: Partial<Pick<ChatConversation, 'title' | 'modelProvider' | 'modelName'>> = {}
        if (request.title !== undefined) updates.title = request.title
        if (request.modelProvider !== undefined) updates.modelProvider = request.modelProvider
        if (request.modelName !== undefined) updates.modelName = request.modelName

        if (Object.keys(updates).length > 0) {
            await conversationRepo().update(conversation.id, updates)
        }
        return { ...conversation, ...updates }
    },

    async deleteConversation({ id, projectId }: GetConversationParams): Promise<void> {
        await this.getConversationOrThrow({ id, projectId })
        await conversationRepo().delete({ id, projectId })
    },

    async saveMessage({ conversationId, role, content, toolCalls, fileUrls, tokenUsage }: SaveMessageParams): Promise<ChatMessage> {
        return messageRepo().save({
            id: apId(),
            conversationId,
            role,
            content,
            toolCalls: toolCalls ?? null,
            fileUrls: fileUrls ?? null,
            tokenUsage: tokenUsage ?? null,
        }) as Promise<ChatMessage>
    },

    async listMessages({ conversationId, cursor, limit }: ListMessagesParams): Promise<SeekPage<ChatMessage>> {
        const queryBuilder = messageRepo()
            .createQueryBuilder('m')
            .where('m.conversationId = :conversationId', { conversationId })
            .orderBy('m.created', 'ASC')
            .take(limit + 1)

        if (!isNil(cursor)) {
            queryBuilder.andWhere('m.created > (SELECT cm.created FROM chat_message cm WHERE cm.id = :cursor)', { cursor })
        }

        const results = await queryBuilder.getMany()
        const hasMore = results.length > limit
        const data = hasMore ? results.slice(0, limit) : results

        return {
            data: data as ChatMessage[],
            next: hasMore ? data[data.length - 1].id : null,
            previous: null,
        }
    },

    async getRecentMessages({ conversationId, limit }: { conversationId: string, limit: number }): Promise<ChatMessage[]> {
        const messages = await messageRepo()
            .createQueryBuilder('m')
            .where('m.conversationId = :conversationId', { conversationId })
            .orderBy('m.created', 'DESC')
            .take(limit)
            .getMany()
        return (messages as ChatMessage[]).reverse()
    },
})

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
}

type UpdateConversationParams = {
    id: string
    projectId: string
    request: UpdateChatConversationRequest
}

type SaveMessageParams = {
    conversationId: string
    role: ChatMessageRole
    content: string
    toolCalls?: ToolCallRecord[]
    fileUrls?: string[]
    tokenUsage?: TokenUsage
}

type ListMessagesParams = {
    conversationId: string
    cursor?: string
    limit: number
}
