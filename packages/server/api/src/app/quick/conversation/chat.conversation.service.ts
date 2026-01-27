import { ActivepiecesError, apId, ConversationMessage, ErrorCode, isNil, spreadIfDefined } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { ChatConversationSchema, ChatConversationEntity } from './chat.conversation.entity'
import { chatSessionService } from '../session/chat.session.service'

export const chatConversationRepo = repoFactory<ChatConversationSchema>(ChatConversationEntity)

export const chatConversationService = (log: FastifyBaseLogger) => ({
    async create(params: CreateConversationParams): Promise<ChatConversationSchema> {
        // Verify session exists and belongs to user
        await chatSessionService(log).getOneOrThrow({
            id: params.sessionId,
            userId: params.userId,
        })

        const count = await chatConversationRepo().count({
            where: {
                sessionId: params.sessionId,
            },
        })
        const newConversation: Partial<ChatConversationSchema> = {
            id: apId(),
            title: `Conversation ${count + 1}`,
            sessionId: params.sessionId,
            conversation: params.conversation || [],
        }
        return chatConversationRepo().save(newConversation)
    },

    async update(params: UpdateConversationParams): Promise<ChatConversationSchema> {
        // Verify session exists and belongs to user
        await chatSessionService(log).getOneOrThrow({
            id: params.sessionId,
            userId: params.userId,
        })

        await chatConversationRepo().update(params.id, {
            ...spreadIfDefined('conversation', params.conversation),
        })
        return this.getOneOrThrow({ 
            id: params.id, 
            sessionId: params.sessionId,
            userId: params.userId,
        })
    },

    async getOne(params: GetOneParams): Promise<ChatConversationSchema | null> {
        // Verify session exists and belongs to user
        await chatSessionService(log).getOneOrThrow({
            id: params.sessionId,
            userId: params.userId,
        })

        return chatConversationRepo().findOneBy({
            id: params.id,
            sessionId: params.sessionId,
        })
    },

    async getOneOrThrow(params: GetOneParams): Promise<ChatConversationSchema> {
        const conversation = await this.getOne(params)

        if (isNil(conversation)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: params.id,
                    entityType: 'ChatConversation',
                },
            })
        }

        return conversation
    },

    async list(params: ListConversationsParams): Promise<ChatConversationSchema[]> {
        // Verify session exists and belongs to user
        await chatSessionService(log).getOneOrThrow({
            id: params.sessionId,
            userId: params.userId,
        })

        return chatConversationRepo().find({
            where: {
                sessionId: params.sessionId,
            },
            order: {
                created: 'DESC',
            },
        })
    },

    async delete(params: GetOneParams): Promise<void> {
        // Verify session exists and belongs to user
        await chatSessionService(log).getOneOrThrow({
            id: params.sessionId,
            userId: params.userId,
        })

        const result = await chatConversationRepo().delete({
            id: params.id,
            sessionId: params.sessionId,
        })

        if (result.affected === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: params.id,
                    entityType: 'ChatConversation',
                },
            })
        }
    },

    async getOrCreate(params: GetOrCreateConversationParams): Promise<ChatConversationSchema> {
        // Verify session exists and belongs to user
        await chatSessionService(log).getOneOrThrow({
            id: params.sessionId,
            userId: params.userId,
        })

        if (params.conversationId) {
            return this.getOneOrThrow({
                id: params.conversationId,
                sessionId: params.sessionId,
                userId: params.userId,
            })
        }

        // Create a new conversation if none provided
        return this.create({
            userId: params.userId,
            sessionId: params.sessionId,
            conversation: [],
        })
    },
})

type CreateConversationParams = {
    userId: string
    sessionId: string
    conversation?: ConversationMessage[]
}

type GetOneParams = {
    id: string
    sessionId: string
    userId: string
}

type UpdateConversationParams = {
    id: string
    sessionId: string
    userId: string
    conversation?: ConversationMessage[]
}

type ListConversationsParams = {
    sessionId: string
    userId: string
}

type GetOrCreateConversationParams = {
    userId: string
    sessionId: string
    conversationId?: string
}
