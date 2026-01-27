import { ActivepiecesError, apId, ChatFileAttachment, ChatSession, DEFAULT_CHAT_MODEL, ErrorCode, genericAgentUtils, isNil, spreadIfDefined } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { projectService } from '../../project/project-service'
import { ChatSessionEntity } from './chat.session.entity'
import { genericAgentService } from '../../generic-agent/generic-agent.service'
import { chatConversationService } from '../conversation/chat.conversation.service'

export const chatSessionRepo = repoFactory<ChatSession>(ChatSessionEntity)

export const chatSessionService = (log: FastifyBaseLogger)=> ({
    async create(userId: string): Promise<ChatSession> {
        const newSession: Partial<ChatSession> = {
            id: apId(),
            userId,
            modelId: DEFAULT_CHAT_MODEL,
            state: {},
            tools: [],
        }
        const savedSession = await chatSessionRepo().save(newSession)
        const conversation = await chatConversationService(log).create({
            userId: userId,
            sessionId: savedSession.id,
            conversation: [],
        })
        return {
            ...savedSession,
            conversations: [conversation],
        }
    },

    async chatWithSession(params: ChatWithSessionParams): Promise<string> {
        const session: ChatSession = await this.getOneOrThrow({
            id: params.sessionId,
            userId: params.userId,
        })
        const project = await projectService.getPersonalProject(params.userId)
        const filesForMessage = params.files?.map(file => ({
            name: file.name,
            type: file.mimeType,
            url: file.url,
        }))

        // Get or create conversation
        const conversationEntity = await chatConversationService(log).getOrCreate({
            userId: params.userId,
            sessionId: params.sessionId,
            conversationId: params.conversationId,
        })
        const conversation = conversationEntity.conversation
        const conversationId = conversationEntity.id

        // Add user message to conversation
        const sessionData = {
            conversation,
            tools: session.tools,
            modelId: session.modelId,
            state: session.state,
            prompt: params.message,
        }
        const updatedSessionData = genericAgentUtils.addUserMessage(sessionData, params.message, filesForMessage)

        // Update conversation
        await chatConversationService(log).update({
            id: conversationId,
            sessionId: params.sessionId,
            userId: params.userId,
            conversation: updatedSessionData.conversation || [],
        })

        return await genericAgentService(log).executeAgent({
            projectId: project.id,
            platformId: params.platformId,
            prompt: params.message,
            tools: session.tools,
            modelId: session.modelId,
            state: session.state,
            conversation: updatedSessionData.conversation,
        })
    },
    async update(params: UpdateChastSessionParams): Promise<ChatSession> {
        await chatSessionRepo().update(params.id, {
            ...spreadIfDefined('modelId', params.session.modelId),
            ...spreadIfDefined('state', params.session.state),
            ...spreadIfDefined('tools', params.session.tools),
        })
        return this.getOneOrThrow({ id: params.id, userId: params.userId })
    },

    async getOne(params: GetOneParams): Promise<ChatSession | null> {
        return chatSessionRepo().findOne({
            where: {
                id: params.id,
                userId: params.userId,
            },
            relations: {
                conversations: true,
            },
        })
    },

    async getOneOrThrow(params: GetOneParams): Promise<ChatSession> {
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

    async delete(params: GetOneParams): Promise<void> {
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
})

type ChatWithSessionParams = {
    platformId: string
    userId: string
    sessionId: string
    message: string
    files?: ChatFileAttachment[]
    conversationId?: string
}

type GetOneParams = {
    id: string
    userId: string
}

type UpdateChastSessionParams = {
    id: string
    userId: string
    session: Partial<ChatSession>
}