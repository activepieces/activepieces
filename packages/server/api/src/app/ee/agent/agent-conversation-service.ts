import { ActivepiecesError, apId, ErrorCode, isNil, sanitizeObjectForPostgresql, SeekPage, spreadIfDefined } from '@activepieces/core-utils'
import { AgentConversation, AgentConversationStatus, AgentHistoryMessage, AgentRunSource, CreateAgentConversationRequest, PersistedAgentMessage, PersistedAgentRole, SetAgentMessageFeedbackRequest, UpdateAgentConversationRequest } from '@activepieces/shared'
import { ModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { agentApprovalGate } from './agent-approval-gate'
import { AgentConversationEntity } from './agent-conversation-entity'
import { agentHelpers, EVAL_CONVERSATION_ID_PREFIX, isEvalConversationId } from './agent-helpers'
import { agentService } from './agent-service'
import { agentHistory } from './history/agent-history'

export const agentConversationService = (log: FastifyBaseLogger) => ({
    async createConversation({ platformId, userId, request, id }: CreateConversationParams): Promise<AgentConversation> {
        const agent = isNil(request.agentId)
            ? null
            : await agentService(log).getOneOrThrowByPlatform({ id: request.agentId, platformId, userId })
        const conversation = await agentHelpers.conversationRepo().save({
            id: id ?? apId(),
            platformId,
            projectId: agent?.projectId ?? null,
            userId,
            agentId: agent?.id ?? null,
            source: isNil(agent) ? AgentRunSource.CHAT : AgentRunSource.AGENT,
            title: request.title ?? null,
            modelName: request.modelName ?? null,
            messages: [],
        })
        log.info({ conversation: { id: conversation.id }, platform: { id: platformId }, user: { id: userId } }, '[agentConversationService] Conversation created')
        return conversation
    },

    async listConversations({ platformId, userId, cursor, limit, agentId }: ListConversationsParams): Promise<SeekPage<AgentConversation>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor)
        const paginator = buildPaginator({
            entity: AgentConversationEntity,
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

        const queryBuilder = agentHelpers.conversationRepo()
            .createQueryBuilder('agent_conversation')
            .select([
                'agent_conversation.id',
                'agent_conversation.created',
                'agent_conversation.updated',
                'agent_conversation.platformId',
                'agent_conversation.projectId',
                'agent_conversation.userId',
                'agent_conversation.title',
                'agent_conversation.modelName',
                'agent_conversation.status',
            ])
            .where({ platformId, userId })
            // Eval conversations are owned by the platform owner; keep them out of the regular list.
            .andWhere('agent_conversation.id NOT LIKE :evalPrefix', { evalPrefix: `${EVAL_CONVERSATION_ID_PREFIX}%` })
        if (isNil(agentId)) {
            queryBuilder.andWhere('agent_conversation.source = :chatSource', { chatSource: AgentRunSource.CHAT })
        }
        else {
            queryBuilder
                .andWhere('agent_conversation.source = :agentSource', { agentSource: AgentRunSource.AGENT })
                .andWhere('agent_conversation."agentId" = :agentId', { agentId })
        }

        const { data, cursor: paginationCursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage(data, paginationCursor)
    },

    async getConversationOrThrow({ id, platformId, userId }: ConversationIdentifier): Promise<AgentConversation> {
        // Eval conversations must never be opened or messaged through the regular (non-dry-run) chat
        // path — that would run real tools against a conversation meant to be side-effect-free.
        if (isEvalConversationId(id)) {
            throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: { entityId: id, entityType: 'AgentConversation' } })
        }
        const conversation = await agentHelpers.getConversationOrThrow({ id, platformId, userId, log })
        if (![AgentRunSource.CHAT, AgentRunSource.AGENT].includes(conversation.source)) {
            throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: { entityId: id, entityType: 'AgentConversation' } })
        }
        return conversation
    },

    async updateConversation({ id, platformId, userId, request }: UpdateConversationParams): Promise<AgentConversation> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        const updates = {
            ...spreadIfDefined('title', request.title),
            ...spreadIfDefined('modelName', request.modelName),
        }

        if (Object.keys(updates).length > 0) {
            await agentHelpers.conversationRepo().update(conversation.id, updates)
        }
        return { ...conversation, ...updates }
    },

    async deleteConversation({ id, platformId, userId }: ConversationIdentifier): Promise<void> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        if (conversation.status === AgentConversationStatus.STREAMING) {
            await agentApprovalGate.requestCancel({ conversationId: id })
            await agentHelpers.conversationRepo().update(id, {
                status: AgentConversationStatus.IDLE,
            })
        }
        await agentHelpers.conversationRepo().delete(conversation.id)
        log.info({ conversation: { id }, platform: { id: platformId }, user: { id: userId } }, '[agentConversationService] Conversation deleted')
    },

    async getMessages({ id, platformId, userId }: ConversationIdentifier): Promise<{ data: PersistedAgentMessage[] | AgentHistoryMessage[] }> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        if (conversation.uiMessages) {
            return { data: conversation.uiMessages }
        }
        const messages = agentHistory.reconstruct(conversation.messages as ModelMessage[])
        return { data: messages }
    },

    async setMessageFeedback({ id, platformId, userId, messageIndex, request }: SetMessageFeedbackParams): Promise<void> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        const target = conversation.uiMessages?.[messageIndex]
        if (isNil(target) || target.role !== PersistedAgentRole.ASSISTANT) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'AgentMessage', entityId: `${id}#${messageIndex}` },
            })
        }
        // Patch only this message's feedback via atomic jsonb_set, never a full-array rewrite — a
        // concurrent worker append during a STREAMING turn must not be clobbered by a stale snapshot.
        const repo = agentHelpers.conversationRepo()
        const table = repo.metadata.tableName
        const path = `{${messageIndex},feedback}`
        if (isNil(request.rating)) {
            await repo.query(`UPDATE "${table}" SET "uiMessages" = "uiMessages" #- $1::text[] WHERE id = $2`, [path, conversation.id])
        }
        else {
            const reasons = request.reasons?.length ? request.reasons : undefined
            const comment = request.comment?.trim() || undefined
            const feedback = { rating: request.rating, ...spreadIfDefined('reasons', reasons), ...spreadIfDefined('comment', comment) }
            const value = JSON.stringify(sanitizeObjectForPostgresql(feedback))
            await repo.query(`UPDATE "${table}" SET "uiMessages" = jsonb_set("uiMessages", $1::text[], $2::jsonb, true) WHERE id = $3`, [path, value, conversation.id])
        }
        log.info({ conversation: { id }, messageIndex, rating: request.rating }, '[agentConversationService] Message feedback recorded')
    },

})

type CreateConversationParams = {
    platformId: string
    userId: string
    request: CreateAgentConversationRequest
    id?: string
}

type ListConversationsParams = {
    platformId: string
    userId: string
    cursor?: string
    limit: number
    agentId?: string
}

type ConversationIdentifier = {
    id: string
    platformId: string
    userId: string
}

type UpdateConversationParams = ConversationIdentifier & {
    request: UpdateAgentConversationRequest
}

type SetMessageFeedbackParams = ConversationIdentifier & {
    messageIndex: number
    request: SetAgentMessageFeedbackRequest
}
