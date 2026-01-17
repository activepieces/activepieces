import { ActivepiecesError, apId, ChatSession, chatSessionUtils, ConversationMessage, ErrorCode, ExecuteAgentJobData, WorkerJobType } from '@activepieces/shared'
import { isNil } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { ChatSessionEntity } from './chat.session.entity'
import { jobQueue } from '../../workers/queue/job-queue'
import { FastifyBaseLogger } from 'fastify'
import { JobType } from '../../workers/queue/queue-manager'

export const chatSessionRepo = repoFactory<ChatSession>(ChatSessionEntity)

export const chatSessionService= (log: FastifyBaseLogger)=> ({
    async create(userId: string): Promise<ChatSession> {
        const newSession: Partial<ChatSession> = {
            id: apId(),
            userId: userId,
            conversation: [],
        }
        return await chatSessionRepo().save(newSession)
    },

    async chatWithSession(params: ChatWithSessionParams): Promise<ChatSession> {
        const session: ChatSession = await this.getOneOrThrow({
            id: params.sessionId,
            userId: params.userId,
        })
        const newSession = await chatSessionUtils.addUserMessage(session, params.message)
        await chatSessionRepo().save(newSession)
        const jobData: ExecuteAgentJobData = {
            platformId: params.platformId,
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
        })
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
    platformId: string;
    userId: string;
    sessionId: string;
    message: string;
}

type GetOneParams = {
    id: string;
    userId: string;
}