import { apId, isNil, spreadIfDefined } from '@activepieces/core-utils'
import { ChatConversationStatus, CreateChatConversationRequest, LATEST_JOB_DATA_SCHEMA_VERSION, PrincipalType, SendChatMessageRequest, SERVICE_KEY_SECURITY_OPENAPI, UpdateChatConversationRequest, WorkerJobType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { assertCreditsAndAppSumoNotExceeded } from '../../platform/billing-provider'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { chatApprovalGate } from './chat-approval-gate'
import { chatHelpers } from './chat-helpers'
import { chatRolloutService } from './chat-rollout-service'
import { chatService } from './chat-service'
import { findConnectionsForPiece } from './tools/chat-tools'

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
        const { content, runId: clientRunId, files } = request.body
        const conversationId = request.params.id
        const userId = request.principal.id
        const platformId = request.principal.platform.id
        const log = request.log.child({ conversation: { id: conversationId }, user: { id: userId }, platform: { id: platformId } })

        log.info({ filesCount: files?.length ?? 0, contentLength: content.length }, '[chatController] Chat message received')

        const conversation = await chatService(log).getConversationOrThrow({
            id: conversationId,
            platformId,
            userId,
        })

        // Cloud rollout/funnel: count this user as a distinct chatter (no-op off cloud, deduped).
        rejectedPromiseHandler(chatRolloutService.recordChatted({ userId, platformId }), log)

        const runId = typeof clientRunId === 'string' ? clientRunId : apId()
        const runLog = log.child({ run: { id: runId } })

        // Claim ownership atomically in the DB — the single source of truth that
        // saveChatMessages/updateChatProgress/heartbeat fence against. A late write from the
        // preempted run is rejected as soon as this UPDATE commits (its runId no longer matches),
        // with no Redis/DB split to race through. The prior owner is read from the same row.
        const preemptedRunId = conversation.status === ChatConversationStatus.STREAMING
            ? conversation.activeRunId
            : null
        await chatHelpers.conversationRepo().update(conversationId, { activeRunId: runId })

        if (conversation.status === ChatConversationStatus.STREAMING) {
            log.info({ ...spreadIfDefined('preemptedRunId', preemptedRunId ?? undefined) }, '[chatController] Cancelling in-flight run before new message')
            const cancelPromises = [
                chatApprovalGate.requestCancel({ conversationId }),
            ]
            if (preemptedRunId) {
                cancelPromises.push(chatApprovalGate.requestCancel({ conversationId, runId: preemptedRunId }))
            }
            await Promise.all(cancelPromises)
            await chatHelpers.conversationRepo().update(conversationId, {
                status: ChatConversationStatus.IDLE,
            })
            await chatApprovalGate.clearPendingGate({ conversationId })
        }

        await assertCreditsAndAppSumoNotExceeded({ platformId, log })

        await jobQueue(runLog).add({
            id: apId(),
            type: JobType.ONE_TIME,
            data: {
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                jobType: WorkerJobType.EXECUTE_CHAT_AGENT,
                conversationId,
                runId,
                projectId: conversation.projectId ?? null,
                platformId,
                userId,
                userMessage: content,
                modelName: conversation.modelName ?? null,
                files,
            },
        })
        runLog.info({ job: { type: WorkerJobType.EXECUTE_CHAT_AGENT } }, '[chatController] Enqueued chat agent job')

        return reply.status(StatusCodes.OK).send({ conversationId, runId })
    })

    app.post('/funnel/landing', FunnelLandingRoute, async (request, reply) => {
        rejectedPromiseHandler(chatRolloutService.recordLanding({
            userId: request.principal.id,
            platformId: request.principal.platform.id,
        }), request.log)
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.post('/tool-approvals/:gateId', ToolApprovalRoute, async (request, reply) => {
        request.log.info({ gate: { id: request.params.gateId }, approved: request.body.approved }, '[chatController] Tool approval received')
        await chatApprovalGate.resolveGate({
            gateId: request.params.gateId,
            approved: request.body.approved,
            payload: request.body.payload,
            log: request.log,
        })
        return reply.status(StatusCodes.OK).send({ success: true })
    })

    app.post('/conversations/:id/cancel', CancelConversationRoute, async (request, reply) => {
        const conversationId = request.params.id
        const platformId = request.principal.platform.id
        const userId = request.principal.id
        const log = request.log.child({ conversation: { id: conversationId }, user: { id: userId }, platform: { id: platformId } })
        const conversation = await chatService(log).getConversationOrThrow({ id: conversationId, platformId, userId })
        const activeRunId = conversation.activeRunId
        log.info({ ...spreadIfDefined('activeRunId', activeRunId ?? undefined) }, '[chatController] Cancel requested')
        const cancelPromises = [
            chatApprovalGate.requestCancel({ conversationId }),
        ]
        if (activeRunId) {
            cancelPromises.push(chatApprovalGate.requestCancel({ conversationId, runId: activeRunId }))
        }
        await Promise.all(cancelPromises)
        await chatHelpers.conversationRepo().update(conversationId, {
            status: ChatConversationStatus.IDLE,
        })
        await chatApprovalGate.clearPendingGate({ conversationId })
        return reply.status(StatusCodes.OK).send({ success: true })
    })

    app.get('/conversations/:id/pending-gate', GetPendingGateRoute, async (request, reply) => {
        const conversationId = request.params.id
        const platformId = request.principal.platform.id
        const userId = request.principal.id
        const conversation = await chatService(request.log).getConversationOrThrow({ id: conversationId, platformId, userId })
        const gate = await chatApprovalGate.getPendingGate({ conversationId })
        // A preempted run can leave (or race in) a pending gate keyed by conversation; only surface
        // the gate when it belongs to the run that currently owns the conversation.
        const gateRunId = gate?.runId
        const staleGate = !isNil(gateRunId) && !isNil(conversation.activeRunId) && gateRunId !== conversation.activeRunId
        return reply.status(StatusCodes.OK).send(staleGate ? null : gate)
    })

    app.get('/conversations/:id/connections', GetPickerConnectionsRoute, async (request, reply) => {
        const conversationId = request.params.id
        const platformId = request.principal.platform.id
        const userId = request.principal.id
        await chatService(request.log).getConversationOrThrow({ id: conversationId, platformId, userId })
        const pieceName = request.query.pieceName
        const cached = await chatApprovalGate.getAvailableConnections({ conversationId, pieceName })
        if (cached.length > 0) {
            return reply.status(StatusCodes.OK).send(cached)
        }
        const projects = await chatHelpers.getUserProjects({ platformId, userId, log: request.log })
        const result = await findConnectionsForPiece({ pieceName, projects, platformId, log: request.log })
        if ('pickConnection' in result) {
            await chatApprovalGate.storeAvailableConnections({ conversationId, pieceName, connections: result.connections })
            return reply.status(StatusCodes.OK).send(result.connections)
        }
        return reply.status(StatusCodes.OK).send([])
    })

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

const FunnelLandingRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
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

