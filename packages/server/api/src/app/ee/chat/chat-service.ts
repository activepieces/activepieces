import { ActivepiecesError, apId, ErrorCode, isNil, SeekPage, spreadIfDefined } from '@activepieces/core-utils'
import { ChatConversation, ChatConversationStatus, ChatHistoryMessage, ChatMode, CreateChatConversationRequest, PersistedChatMessage, PersistedChatPartType, PersistedChatRole, PersistedToolCallStatus, UpdateChatConversationRequest } from '@activepieces/shared'
import { ModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { chatApprovalGate } from './chat-approval-gate'
import { ChatConversationEntity } from './chat-conversation-entity'
import { chatHelpers, EVAL_CONVERSATION_ID_PREFIX, isEvalConversationId } from './chat-helpers'
import { chatHistory } from './history/chat-history'

export const chatService = (log: FastifyBaseLogger) => ({
    async createConversation({ platformId, userId, request, id }: CreateConversationParams): Promise<ChatConversation> {
        const conversation = await chatHelpers.conversationRepo().save({
            id: id ?? apId(),
            platformId,
            projectId: null,
            userId,
            title: request.title ?? null,
            modelName: request.modelName ?? null,
            messages: [],
        })
        log.info({ conversation: { id: conversation.id }, platform: { id: platformId }, user: { id: userId } }, '[chatService] Conversation created')
        return conversation
    },

    // One persistent "Refer & earn" conversation per user — the offer icon reopens the same chat
    // every time. Scoped by chatMode so it never collides with normal conversations.
    async getOrCreateReferralConversation({ platformId, userId }: { platformId: string, userId: string }): Promise<ChatConversation> {
        // Seed a short, playful greeting so the agent "speaks first" the instant the chat opens
        // (rendered from stored uiMessages — no LLM turn). The quick-reply is the primary CTA; the
        // text stands on its own if the buttons don't render.
        const greeting: PersistedChatMessage[] = [{
            role: PersistedChatRole.ASSISTANT,
            parts: [
                {
                    type: PersistedChatPartType.TEXT,
                    text: 'Well, well. Look who found the back room. 🕵️\n\nThere\'s $10 in free AI credits in here for you, plus $10 for a partner in crime, if you pull off one quiet little mission. Most people walk right past it. You? You\'ve got the look.\n\nSo... you in?',
                },
                {
                    type: PersistedChatPartType.TOOL_CALL,
                    toolCallId: 'referral-intro-quick-replies',
                    toolName: 'ap_show_quick_replies',
                    input: { replies: ['I\'m in 🫡', 'How does it work?'] },
                    status: PersistedToolCallStatus.COMPLETED,
                },
            ],
        }]

        const existing = await chatHelpers.conversationRepo().findOne({
            where: { platformId, userId, chatMode: ChatMode.REFERRAL },
            order: { created: 'DESC' },
        })
        if (!isNil(existing)) {
            // Backfill the greeting for a conversation created before it existed (or one that never
            // got a turn), so returning users still get greeted. Never overwrite real history.
            const hasNoHistory = isNil(existing.uiMessages) || existing.uiMessages.length === 0
            if (hasNoHistory) {
                await chatHelpers.conversationRepo().update(existing.id, { uiMessages: JSON.parse(JSON.stringify(greeting)) })
                return { ...existing, uiMessages: greeting }
            }
            return existing
        }
        const conversation = await chatHelpers.conversationRepo().save({
            id: apId(),
            platformId,
            projectId: null,
            userId,
            title: 'The $10 mission',
            modelName: null,
            messages: [],
            chatMode: ChatMode.REFERRAL,
            uiMessages: greeting,
        })
        log.info({ conversation: { id: conversation.id }, platform: { id: platformId }, user: { id: userId } }, '[chatService] Referral conversation created')
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
            // Eval conversations are owned by the platform owner; keep them out of the regular list.
            .andWhere('chat_conversation.id NOT LIKE :evalPrefix', { evalPrefix: `${EVAL_CONVERSATION_ID_PREFIX}%` })
            // The "Refer & earn" conversation is reached only via its sidebar entry, never the history list.
            .andWhere('chat_conversation.chatMode = :normalMode', { normalMode: ChatMode.NORMAL })

        const { data, cursor: paginationCursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage(data, paginationCursor)
    },

    async getConversationOrThrow({ id, platformId, userId }: ConversationIdentifier): Promise<ChatConversation> {
        // Eval conversations must never be opened or messaged through the regular (non-dry-run) chat
        // path — that would run real tools against a conversation meant to be side-effect-free.
        if (isEvalConversationId(id)) {
            throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: { entityId: id, entityType: 'ChatConversation' } })
        }
        return chatHelpers.getConversationOrThrow({ id, platformId, userId, log })
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
        log.info({ conversation: { id }, platform: { id: platformId }, user: { id: userId } }, '[chatService] Conversation deleted')
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
    id?: string
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
