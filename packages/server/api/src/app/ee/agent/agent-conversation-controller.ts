import { ActivepiecesError, apId, ErrorCode, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { AgentConversationStatus, AgentRunSource, CreateAgentConversationRequest, ImportAgentMemoryRequest, InstructAgentMemoryRequest, LATEST_JOB_DATA_SCHEMA_VERSION, PrincipalType, SendAgentMessageRequest, SERVICE_KEY_SECURITY_OPENAPI, SetAgentMessageFeedbackRequest, UpdateAgentConversationRequest, UpdateAgentMemoryRequest, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { assertCreditsAndAppSumoNotExceeded } from '../../platform/billing-provider'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { agentApprovalGate } from './agent-approval-gate'
import { agentConversationService } from './agent-conversation-service'
import { agentHelpers } from './agent-helpers'
import { agentMemoryAi } from './agent-memory-ai'
import { agentService } from './agent-service'
import { chatAnalyticsTelemetry } from './chat-analytics-sync'
import { chatPlanGrant } from './chat-plan-grant'
import { chatRolloutService } from './chat-rollout-service'
import { findConnectionsForPiece } from './tools/agent-tools'

const CHAT_PRINCIPALS = [PrincipalType.USER] as const

export const agentConversationController: FastifyPluginAsyncZod = async (app) => {

    app.post('/conversations', CreateConversationRoute, async (request, reply) => {
        const conversation = await agentConversationService(request.log).createConversation({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            request: request.body,
        })
        return reply.status(StatusCodes.CREATED).send(conversation)
    })

    app.get('/conversations', ListConversationsRoute, async (request) => {
        return agentConversationService(request.log).listConversations({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            cursor: request.query.cursor,
            limit: request.query.limit ?? 20,
            ...spreadIfDefined('agentId', request.query.agentId),
        })
    })

    app.get('/conversations/:id', GetConversationRoute, async (request) => {
        return agentConversationService(request.log).getConversationOrThrow({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
    })

    app.post('/conversations/:id', UpdateConversationRoute, async (request) => {
        return agentConversationService(request.log).updateConversation({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            request: request.body,
        })
    })

    app.delete('/conversations/:id', DeleteConversationRoute, async (request, reply) => {
        await agentConversationService(request.log).deleteConversation({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.get('/conversations/:id/messages', GetMessagesRoute, async (request) => {
        return agentConversationService(request.log).getMessages({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
    })

    app.post('/conversations/:id/messages/:messageIndex/feedback', SetMessageFeedbackRoute, async (request, reply) => {
        await agentConversationService(request.log).setMessageFeedback({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            messageIndex: request.params.messageIndex,
            request: request.body,
        })
        return reply.status(StatusCodes.OK).send({ success: true })
    })

    app.post('/funnel/landing', FunnelLandingRoute, async (request, reply) => {
        // Cloud rollout: record that this user opened the chat page, then refresh the console
        // funnel snapshot. Awaited recordLanding so the pushed landed count includes this landing.
        await chatRolloutService.recordLanding({
            userId: request.principal.id,
            platformId: request.principal.platform.id,
        })
        chatAnalyticsTelemetry(request.log).sendRolloutFunnelUpdate()
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.post('/conversations/:id/messages', SendMessageRoute, async (request, reply) => {
        const { content, runId: clientRunId, files } = request.body
        const conversationId = request.params.id
        const userId = request.principal.id
        const platformId = request.principal.platform.id
        const log = request.log.child({ conversation: { id: conversationId }, user: { id: userId }, platform: { id: platformId } })

        log.info({ filesCount: files?.length ?? 0, contentLength: content.length }, '[agentConversationController] Chat message received')

        const conversation = await agentConversationService(log).getConversationOrThrow({
            id: conversationId,
            platformId,
            userId,
        })

        await assertAgentMessageRateLimitNotExceeded({ platformId, userId, log })

        // Cloud rollout: count this user as a distinct chatter (no-op off cloud, deduped).
        const { needsCreditDecision } = await chatRolloutService.recordChatted({ userId, platformId })
        // Refresh the console rollout funnel snapshot (chatted count just changed).
        chatAnalyticsTelemetry(log).sendRolloutFunnelUpdate()
        if (needsCreditDecision) {
            const { error } = await tryCatch(() => chatPlanGrant.grant({ userId, platformId, log }))
            if (!isNil(error)) {
                log.warn({ error, platform: { id: platformId }, user: { id: userId } }, '[agentConversationController] Chat plan grant failed; continuing to the credit gate')
            }
        }

        const runId = typeof clientRunId === 'string' ? clientRunId : apId()
        const runLog = log.child({ run: { id: runId } })

        // Claim ownership atomically in the DB — the single source of truth that
        // saveAgentMessages/updateAgentProgress/heartbeat fence against. A late write from the
        // preempted run is rejected as soon as this UPDATE commits (its runId no longer matches),
        // with no Redis/DB split to race through. The prior owner is read from the same row.
        const preemptedRunId = conversation.status === AgentConversationStatus.STREAMING
            ? conversation.activeRunId
            : null
        await agentHelpers.conversationRepo().update(conversationId, { activeRunId: runId })

        if (conversation.status === AgentConversationStatus.STREAMING) {
            log.info({ ...spreadIfDefined('preemptedRunId', preemptedRunId ?? undefined) }, '[agentConversationController] Cancelling in-flight run before new message')
            const cancelPromises = [
                agentApprovalGate.requestCancel({ conversationId }),
            ]
            if (preemptedRunId) {
                cancelPromises.push(agentApprovalGate.requestCancel({ conversationId, runId: preemptedRunId }))
            }
            await Promise.all(cancelPromises)
            await agentHelpers.conversationRepo().update(conversationId, {
                status: AgentConversationStatus.IDLE,
            })
            await agentApprovalGate.clearPendingGate({ conversationId })
        }

        const agent = isNil(conversation.agentId)
            ? null
            : await agentService(log).getOneOrThrowByPlatform({ id: conversation.agentId, platformId, userId })
        const agentConfig = agent?.published ?? agent?.draft ?? null
        // resolveRunProvider and the assertion below both fall through to the platform's chat
        // provider when no provider is named. An agent answers on its own model or it does not run.
        if (!isNil(agent) && (isNil(agentConfig?.provider) || isNil(agentConfig?.modelName))) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Pick a model for this agent before talking to it' },
            })
        }

        await agentHelpers.assertRunProviderConfigured({ platformId, log, ...spreadIfDefined('provider', agentConfig?.provider ?? undefined) })
        await assertCreditsAndAppSumoNotExceeded({ platformId, log })

        await jobQueue(runLog).add({
            id: apId(),
            type: JobType.ONE_TIME,
            data: {
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                jobType: WorkerJobType.EXECUTE_AGENT_RUN,
                conversationId,
                runId,
                projectId: conversation.projectId ?? null,
                platformId,
                userId,
                userMessage: content,
                modelName: isNil(agent) ? conversation.modelName ?? null : agentConfig?.modelName ?? null,
                files,
                ...spreadIfDefined('source', isNil(agent) ? undefined : AgentRunSource.AGENT),
                ...(isNil(agentConfig) ? {} : {
                    tools: agentConfig.tools,
                    structuredOutput: agentConfig.structuredOutput,
                    maxSteps: agentConfig.maxSteps,
                    ...spreadIfDefined('provider', agentConfig.provider ?? undefined),
                    promptOverride: { system: agentConfig.instructions },
                }),
            },
        })
        runLog.info({ job: { type: WorkerJobType.EXECUTE_AGENT_RUN } }, '[agentConversationController] Enqueued chat agent job')

        return reply.status(StatusCodes.OK).send({ conversationId, runId })
    })

    app.post('/tool-approvals/:gateId', ToolApprovalRoute, async (request, reply) => {
        request.log.info({ gate: { id: request.params.gateId }, approved: request.body.approved }, '[agentConversationController] Tool approval received')
        await agentApprovalGate.resolveGate({
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
        const conversation = await agentConversationService(log).getConversationOrThrow({ id: conversationId, platformId, userId })
        const activeRunId = conversation.activeRunId
        log.info({ ...spreadIfDefined('activeRunId', activeRunId ?? undefined) }, '[agentConversationController] Cancel requested')
        const cancelPromises = [
            agentApprovalGate.requestCancel({ conversationId }),
        ]
        if (activeRunId) {
            cancelPromises.push(agentApprovalGate.requestCancel({ conversationId, runId: activeRunId }))
        }
        await Promise.all(cancelPromises)
        await agentHelpers.conversationRepo().update(conversationId, {
            status: AgentConversationStatus.IDLE,
        })
        await agentApprovalGate.clearPendingGate({ conversationId })
        return reply.status(StatusCodes.OK).send({ success: true })
    })

    app.get('/conversations/:id/pending-gate', GetPendingGateRoute, async (request, reply) => {
        const conversationId = request.params.id
        const platformId = request.principal.platform.id
        const userId = request.principal.id
        const conversation = await agentConversationService(request.log).getConversationOrThrow({ id: conversationId, platformId, userId })
        const gate = await agentApprovalGate.getPendingGate({ conversationId })
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
        await agentConversationService(request.log).getConversationOrThrow({ id: conversationId, platformId, userId })
        const pieceName = request.query.pieceName
        const cached = await agentApprovalGate.getAvailableConnections({ conversationId, pieceName })
        if (cached.length > 0) {
            return reply.status(StatusCodes.OK).send(cached)
        }
        const projects = await agentHelpers.getUserProjects({ platformId, userId, log: request.log })
        const result = await findConnectionsForPiece({ pieceName, projects, platformId, log: request.log })
        if ('pickConnection' in result) {
            await agentApprovalGate.storeAvailableConnections({ conversationId, pieceName, connections: result.connections })
            return reply.status(StatusCodes.OK).send(result.connections)
        }
        return reply.status(StatusCodes.OK).send([])
    })

    app.get('/memory', GetMemoryRoute, async (request) => {
        return agentHelpers.getUserMemory({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
    })

    app.post('/memory', UpdateMemoryRoute, async (request) => {
        return agentHelpers.saveUserMemory({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            instructions: request.body.instructions,
            memories: request.body.memories,
        })
    })

    app.post('/memory/import', ImportMemoryRoute, async (request) => {
        const platformId = request.principal.platform.id
        const userId = request.principal.id
        const draft = await agentMemoryAi.extract({ platformId, text: request.body.text, log: request.log })
        const current = await agentHelpers.getUserMemory({ platformId, userId })
        return agentHelpers.saveUserMemory({
            platformId,
            userId,
            memories: [...current.memories, ...draft.memories],
            baseMemories: current.memories,
        })
    })

    app.post('/memory/instruct', InstructMemoryRoute, async (request) => {
        return agentMemoryAi.applyInstruction({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            instruction: request.body.instruction,
            log: request.log,
        })
    })

}

const CHAT_MESSAGES_PER_WINDOW = 40
const CHAT_MESSAGE_RATE_WINDOW_SECONDS = 10 * 60

// Per-user flood guard: nothing else bounds how fast a user fires messages, and each one enqueues a
// worker job and spends credits. Complements the credit balance, which bounds spend, not rate.
async function assertAgentMessageRateLimitNotExceeded({ platformId, userId, log }: { platformId: string, userId: string, log: FastifyBaseLogger }): Promise<void> {
    const { allowed, count } = await agentHelpers.incrementAndCheckLimit({
        key: `chat-message-rate:${platformId}:${userId}`,
        limit: CHAT_MESSAGES_PER_WINDOW,
        ttlSeconds: CHAT_MESSAGE_RATE_WINDOW_SECONDS,
    })
    if (!allowed) {
        log.warn({ user: { id: userId }, count }, '[agentConversationController] Chat message rate limit exceeded')
        throw new ActivepiecesError({
            code: ErrorCode.CHAT_MESSAGE_LIMIT_EXCEEDED,
            params: { limit: CHAT_MESSAGES_PER_WINDOW, windowSeconds: CHAT_MESSAGE_RATE_WINDOW_SECONDS },
        })
    }
}

const CreateConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: CreateAgentConversationRequest,
    },
}

const ListConversationsRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: z.object({
            cursor: z.string().optional(),
            limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
            agentId: z.string().optional(),
        }),
    },
}

const CONVERSATION_PARAMS = z.object({ id: z.string() })

const GetConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

const UpdateConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        body: UpdateAgentConversationRequest,
    },
}

const DeleteConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

const GetMessagesRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

const SetMessageFeedbackRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({ id: z.string(), messageIndex: z.coerce.number().int().min(0) }),
        body: SetAgentMessageFeedbackRequest,
    },
}

const SendMessageRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        body: SendAgentMessageRequest,
    },
}

const FunnelLandingRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}

const ToolApprovalRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
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
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

const GetPickerConnectionsRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        querystring: z.object({ pieceName: z.string() }),
    },
}

const GetMemoryRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}

const UpdateMemoryRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: UpdateAgentMemoryRequest,
    },
}

const ImportMemoryRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: ImportAgentMemoryRequest,
    },
}

const InstructMemoryRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: InstructAgentMemoryRequest,
    },
}

const CancelConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['agent'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

