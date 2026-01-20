import { ActivepiecesError, apId, ChatSession, chatSessionUtils, DEFAULT_CHAT_MODEL, ErrorCode, ExecuteAgentJobData, isNil, spreadIfDefined, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { projectService } from '../../project/project-service'
import { jobQueue } from '../../workers/queue/job-queue'
import { JobType } from '../../workers/queue/queue-manager'
import { ChatSessionEntity } from './chat.session.entity'

export const chatSessionRepo = repoFactory<ChatSession>(ChatSessionEntity)

export const chatSessionService = (log: FastifyBaseLogger) => ({
    async create(userId: string): Promise<ChatSession> {
        const newSession: Partial<ChatSession> = {
            id: apId(),
            userId,
            conversation: [],
            modelId: DEFAULT_CHAT_MODEL,
            webSearchEnabled: true,
            codeExecutionEnabled: true,
        }
        return chatSessionRepo().save(newSession)
    },

    async chatWithSession(params: ChatWithSessionParams): Promise<ChatSession> {
        const session: ChatSession = await this.getOneOrThrow({
            id: params.sessionId,
            userId: params.userId,
        })
        const project = await projectService.getPersonalProject(params.userId)
        const newSession = chatSessionUtils.addUserMessage(session, params.message)
        await chatSessionRepo().save(newSession)
        const jobData: ExecuteAgentJobData = {
            platformId: params.platformId,
            projectId: project.id,
            session: newSession,
            jobType: WorkerJobType.EXECUTE_AGENT,
        }
        await jobQueue(log).add({
            id: jobData.session.id,
            type: JobType.ONE_TIME,
            data: jobData,
        })
        return newSession
    },
    async update(sessionId: string, session: ChatSession): Promise<void> {
        await chatSessionRepo().update(sessionId, {
            plan: session.plan,
            conversation: session.conversation,
            modelId: session.modelId,
        })
    },

    async updateSession(params: UpdateSessionParams): Promise<ChatSession> {
        await chatSessionRepo().update(params.id, {
            ...spreadIfDefined('modelId', params.modelId),
            ...spreadIfDefined('webSearchEnabled', params.webSearchEnabled),
            ...spreadIfDefined('codeExecutionEnabled', params.codeExecutionEnabled),
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
}

type GetOneParams = {
    id: string
    userId: string
}

type UpdateSessionParams = {
    id: string
    userId: string
    modelId?: string
    webSearchEnabled?: boolean
    codeExecutionEnabled?: boolean
}