import { ActivepiecesError, apId, ChatFileAttachment, ChatSession, DEFAULT_CHAT_MODEL, ErrorCode, genericAgentUtils, isNil, spreadIfDefined } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { projectService } from '../project/project-service'
import { ChatSessionEntity } from './chat.session.entity'
import { genericAgentService } from '../generic-agent/generic-agent.service'
import { buildSystemPrompt } from 'packages/server/worker/src/lib/agent/system-prompt'

export const chatSessionRepo = repoFactory<ChatSession>(ChatSessionEntity)

export const chatSessionService = (log: FastifyBaseLogger)=> ({
    async create(userId: string): Promise<ChatSession> {
        const newSession: Partial<ChatSession> = {
            id: apId(),
            userId,
            conversation: [],
            modelId: DEFAULT_CHAT_MODEL,
            state: {},
            tools: [],
        }
        return chatSessionRepo().save(newSession)
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
        const newSession: ChatSession = {
            ...session,
            conversation: genericAgentUtils.addUserMessage(session.conversation ?? [], params.message, filesForMessage),
        }
        await chatSessionRepo().save(newSession)
        return await genericAgentService(log).executeAgent({
            systemPrompt: buildSystemPrompt(newSession.tools),
            projectId: project.id,
            platformId: params.platformId,
            prompt: params.message,
            tools: newSession.tools,
            modelId: newSession.modelId,
            state: newSession.state,
            conversation: newSession.conversation,
        })
    },
    async update(params: UpdateChastSessionParams): Promise<ChatSession> {
        await chatSessionRepo().update(params.id, {
            ...spreadIfDefined('conversation', params.session.conversation),
            ...spreadIfDefined('modelId', params.session.modelId),
            ...spreadIfDefined('state', params.session.state),
        })
        return this.getOneOrThrow({ id: params.id, userId: params.userId })
    },

    async getOne(params: GetOneParams): Promise<ChatSession | null> {
        return chatSessionRepo().findOneBy({
            id: params.id,
            userId: params.userId,
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