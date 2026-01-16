import { ActivepiecesError, apId, ApId, ChatSession, ConversationMessage, ErrorCode, PlanConversationMessage } from '@activepieces/shared'
import { isNil } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { ChatSessionEntity } from './chat.session.entity'

export const chatSessionRepo = repoFactory<ChatSession>(ChatSessionEntity)

export const chatSessionService = {
    async create(params: {
        userId: string
        plan: PlanConversationMessage
        conversation: ConversationMessage[]
    }): Promise<ChatSession> {
        const newSession: Partial<ChatSession> = {
            id: apId(),
            userId: params.userId,
            plan: params.plan,
            conversation: params.conversation,
        }

        return await chatSessionRepo().save(newSession)
    },

    async listByUserId(userId: string): Promise<ChatSession[]> {
        return chatSessionRepo().find({
            where: { userId },
            order: {
                created: 'DESC',
            },
        })
    },

    async getOne(params: {
        id: ApId
        userId: string
    }): Promise<ChatSession | null> {
        return chatSessionRepo().findOneBy({
            id: params.id,
            userId: params.userId,
        })
    },

    async getOneOrThrow(params: {
        id: ApId
        userId: string
    }): Promise<ChatSession> {
        const session = await this.getOne(params)

        if (isNil(session)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: params.id,
                    entityType: 'ChatSession',
                },
            })
        }

        return session
    },

    async delete(params: {
        id: ApId
        userId: string
    }): Promise<void> {
        const result = await chatSessionRepo().delete({
            id: params.id,
            userId: params.userId,
        })

        if (result.affected === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: params.id,
                    entityType: 'ChatSession',
                },
            })
        }
    },
}