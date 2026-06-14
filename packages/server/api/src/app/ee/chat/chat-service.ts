import {
    apId,
    ChatConversation,
    ChatConversationStatus,
    ChatHistoryMessage,
    CreateChatConversationRequest,
    PersistedChatMessage,
    SeekPage,
    spreadIfDefined,
    UpdateChatConversationRequest,
} from '@activepieces/shared'
import { ModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { chatApprovalGate } from './chat-approval-gate'
import { ChatConversationEntity } from './chat-conversation-entity'
import { chatHelpers } from './chat-helpers'
import { chatHistory } from './history/chat-history'

export const chatService = (log: FastifyBaseLogger) => ({
    async createConversation({ platformId, userId, request, projectId }: CreateConversationParams): Promise<ChatConversation> {
        const conversation = await chatHelpers.conversationRepo().save({
            id: apId(),
            platformId,
            projectId: projectId ?? null,
            userId,
            title: request.title ?? null,
            modelName: request.modelName ?? null,
            messages: [],
        })
        log.info({ conversationId: conversation.id, platformId, userId }, '[chatService] Conversation created')
        return conversation
    },

    async listConversations({ platformId, userId, cursor, limit }: ListConversationsParams): Promise<SeekPage<ChatConversation>> {
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

        const queryBuilder = chatHelpers.conversationRepo()
            .createQueryBuilder('chat_conversation')
            .select([
                'chat_conversation.id',
                'chat_conversation.created',
                'chat_conversation.updated',
                'chat_conversation.platformId',
                'chat_conversation.projectId',
                'chat_conversation.userId',
                'chat_conversation.title',
                'chat_conversation.modelName',
                'chat_conversation.status',
            ])
            .where({ platformId, userId })

        const { data, cursor: paginationCursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage(data, paginationCursor)
    },

    async getConversationOrThrow({ id, platformId, userId }: ConversationIdentifier): Promise<ChatConversation> {
        return chatHelpers.getConversationOrThrow({ id, platformId, userId })
    },

    async updateConversation({ id, platformId, userId, request }: UpdateConversationParams): Promise<ChatConversation> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        const updates = {
            ...spreadIfDefined('title', request.title),
            ...spreadIfDefined('modelName', request.modelName),
        }

        if (Object.keys(updates).length > 0) {
            await chatHelpers.conversationRepo().update(conversation.id, updates)
        }
        return { ...conversation, ...updates }
    },

    async deleteConversation({ id, platformId, userId }: ConversationIdentifier): Promise<void> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        if (conversation.status === ChatConversationStatus.STREAMING) {
            await chatApprovalGate.requestCancel({ conversationId: id })
            await chatHelpers.conversationRepo().update(id, {
                status: ChatConversationStatus.IDLE,
            })
        }
        await chatHelpers.conversationRepo().delete(conversation.id)
        log.info({ conversationId: id, platformId, userId }, '[chatService] Conversation deleted')
    },

    async getMessages({ id, platformId, userId }: ConversationIdentifier): Promise<{ data: PersistedChatMessage[] | ChatHistoryMessage[] }> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        if (conversation.uiMessages) {
            return { data: conversation.uiMessages }
        }
        const messages = chatHistory.reconstruct(conversation.messages as ModelMessage[])
        return { data: messages }
    },

})

type CreateConversationParams = {
    platformId: string
    userId: string
    request: CreateChatConversationRequest
    projectId?: string | null
}

type ListConversationsParams = {
    platformId: string
    userId: string
    cursor?: string
    limit: number
}

type ConversationIdentifier = {
    id: string
    platformId: string
    userId: string
}

type UpdateConversationParams = ConversationIdentifier & {
    request: UpdateChatConversationRequest
}
