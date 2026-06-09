import {
    ActivepiecesError,
    AIProviderName,
    apId,
    ChatConversationStatus,
    CreateChatConversationRequest,
    ErrorCode,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    PrincipalType,
    SendChatMessageRequest,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdateChatConversationRequest,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { aiProviderService } from '../../ai/ai-provider-service'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { platformAiCreditsService } from '../platform/platform-plan/platform-ai-credits.service'
import { chatApprovalGate } from './chat-approval-gate'
import { chatHelpers } from './chat-helpers'
import { chatService } from './chat-service'

const CHAT_PRINCIPALS = [PrincipalType.USER] as const

export const chatController: FastifyPluginAsyncZod = async (app) => {

    app.post('/conversations', CreateConversationRoute, async (request, reply) => {
        const conversation = await chatService(request.log).createConversation({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            request: request.body,
        })
        return reply.status(StatusCodes.CREATED).send(conversation)
    })

    app.get('/conversations', ListConversationsRoute, async (request) => {
        return chatService(request.log).listConversations({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            cursor: request.query.cursor,
            limit: request.query.limit ?? 20,
        })
    })

    app.get('/conversations/:id', GetConversationRoute, async (request) => {
        return chatService(request.log).getConversationOrThrow({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
    })

    app.post('/conversations/:id', UpdateConversationRoute, async (request) => {
        return chatService(request.log).updateConversation({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            request: request.body,
        })
    })

    app.delete('/conversations/:id', DeleteConversationRoute, async (request, reply) => {
        await chatService(request.log).deleteConversation({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.get('/conversations/:id/messages', GetMessagesRoute, async (request) => {
        return chatService(request.log).getMessages({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
    })

    app.post('/conversations/:id/messages', SendMessageRoute, async (request, reply) => {
        const { content, files } = request.body
        const log = request.log
        const conversationId = request.params.id
        const userId = request.principal.id
        const platformId = request.principal.platform.id

        const conversation = await chatService(log).getConversationOrThrow({
            id: conversationId,
            platformId,
            userId,
        })

        await assertAiCreditsNotExhausted({ platformId, log })

        await jobQueue(log).add({
            id: apId(),
            type: JobType.ONE_TIME,
            data: {
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                jobType: WorkerJobType.EXECUTE_CHAT_AGENT,
                conversationId,
                projectId: conversation.projectId ?? null,
                platformId,
                userId,
                userMessage: content,
                modelName: conversation.modelName ?? null,
                files,
            },
        })

        return reply.status(StatusCodes.OK).send({ conversationId })
    })

    app.post('/tool-approvals/:gateId', ToolApprovalRoute, async (request, reply) => {
        await chatApprovalGate.resolveGate({
            gateId: request.params.gateId,
            approved: request.body.approved,
            payload: request.body.payload,
        })
        return reply.status(StatusCodes.OK).send({ success: true })
    })

    app.post('/conversations/:id/cancel', CancelConversationRoute, async (request, reply) => {
        const conversationId = request.params.id
        const platformId = request.principal.platform.id
        const userId = request.principal.id
        await chatService(request.log).getConversationOrThrow({ id: conversationId, platformId, userId })
        await chatApprovalGate.requestCancel({ conversationId })
        await chatHelpers.conversationRepo().update(conversationId, {
            status: ChatConversationStatus.IDLE,
        })
        return reply.status(StatusCodes.OK).send({ success: true })
    })

    app.get('/conversations/:id/pending-gate', GetPendingGateRoute, async (request, reply) => {
        const conversationId = request.params.id
        const platformId = request.principal.platform.id
        const userId = request.principal.id
        await chatService(request.log).getConversationOrThrow({ id: conversationId, platformId, userId })
        const gate = await chatApprovalGate.getPendingGate({ conversationId })
        return reply.status(StatusCodes.OK).send(gate)
    })

    app.get('/conversations/:id/connections', GetPickerConnectionsRoute, async (request, reply) => {
        const conversationId = request.params.id
        const platformId = request.principal.platform.id
        const userId = request.principal.id
        await chatService(request.log).getConversationOrThrow({ id: conversationId, platformId, userId })
        const connections = await chatApprovalGate.getAvailableConnections({
            conversationId,
            pieceName: request.query.pieceName,
        })
        return reply.status(StatusCodes.OK).send(connections)
    })

}

async function assertAiCreditsNotExhausted({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<void> {
    const chatProvider = await aiProviderService(log).getChatProvider({ platformId })
    if (!chatProvider || chatProvider.provider !== AIProviderName.ACTIVEPIECES) {
        return
    }
    const usage = await platformAiCreditsService(log).getUsage(platformId)
    if (usage.usageRemaining <= 0) {
        throw new ActivepiecesError({
            code: ErrorCode.AI_CREDIT_LIMIT_EXCEEDED,
            params: {
                usage: usage.usage,
                limit: usage.limit,
            },
        })
    }
}

const CreateConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: CreateChatConversationRequest,
    },
}

const ListConversationsRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: z.object({
            cursor: z.string().optional(),
            limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
        }),
    },
}

const CONVERSATION_PARAMS = z.object({ id: z.string() })

const GetConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

const UpdateConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        body: UpdateChatConversationRequest,
    },
}

const DeleteConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

const GetMessagesRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

const SendMessageRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        body: SendChatMessageRequest,
    },
}

const ToolApprovalRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({ gateId: z.string() }),
        body: z.object({ approved: z.boolean(), payload: z.record(z.string(), z.unknown()).optional() }),
    },
}

const GetPendingGateRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

const GetPickerConnectionsRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        querystring: z.object({ pieceName: z.string() }),
    },
}

const CancelConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

