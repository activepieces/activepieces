import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { ChatConversationStatus, CreateChatConversationRequest, PersistedChatMessage, PrincipalType, SendChatMessageRequest, SERVICE_KEY_SECURITY_OPENAPI, UpdateChatConversationRequest, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { aiProviderService } from '../../ai/ai-provider-service'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { platformAiCreditsService } from '../platform/platform-plan/platform-ai-credits.service'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { chatApprovalGate } from './chat-approval-gate'
import { chatGateUtils } from './chat-gate-utils'
import { chatHelpers } from './chat-helpers'
import { chatJob } from './chat-job'
import { chatResume } from './chat-resume'
import { chatRolloutService } from './chat-rollout-service'
import { chatService } from './chat-service'
import { chatAnalyticsTelemetry } from './chat-sync-job'
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

        log.info({ filesCount: files?.length ?? 0, contentLength: content.length }, '[chatController] Chat message received')

        const conversation = await chatService(log).getConversationOrThrow({
            id: conversationId,
            platformId,
            userId,
        })

        // Cloud rollout: count this user as a distinct chatter (no-op off cloud, deduped). Until the
        // one-time free-credit decision is settled, attempt the grant — driven by needsCreditDecision
        // (not the one-shot firstChat) so a transient top-up failure is retried on a later message.
        // Awaited before the credit check below so the managed key is created (and topped up) once.
        const { needsCreditDecision } = await chatRolloutService.recordChatted({ userId, platformId })
        if (needsCreditDecision) {
            await maybeGrantFreeChatCredits({ platformId, userId, log })
        }
        // Refresh the console rollout funnel snapshot (chatted count just changed).
        chatAnalyticsTelemetry(log).sendRolloutFunnelUpdate()

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

        await assertAiCreditsNotExhausted({ platformId, log })

        await chatJob.enqueueChatAgentJob({
            conversationId,
            runId,
            projectId: conversation.projectId ?? null,
            platformId,
            userId,
            userMessage: content,
            modelName: conversation.modelName ?? null,
            files,
            log: runLog,
        })
        runLog.info({ job: { type: WorkerJobType.EXECUTE_CHAT_AGENT } }, '[chatController] Enqueued chat agent job')

        return reply.status(StatusCodes.OK).send({ conversationId, runId })
    })

    app.post('/tool-approvals/:gateId', ToolApprovalRoute, async (request, reply) => {
        const gateId = request.params.gateId
        const platformId = request.principal.platform.id
        const userId = request.principal.id
        const { approved, payload, conversationId: bodyConversationId } = request.body
        request.log.info({ gate: { id: gateId }, approved }, '[chatController] Tool approval received')

        // Step 1: record the decision and wake any live worker blocking on the gate (fast-path,
        // same-turn continuation). Non-destructive (Fix 3): the pending-gate mapping is NOT deleted
        // here, so we can still resolve routing below and pick the correct path — deletion happens
        // only at a real consumption point.
        const { conversationId: mappedConversationId } = await chatApprovalGate.resolveGate({ gateId, approved, payload, log: request.log })

        // Step 2: resolve routing mapping-first, body-conversationId fallback (Fix 2) so a parked
        // answer survives the Redis mapping's 15-min TTL / a Redis restart. The fallback is validated
        // by the usual platform/user scoping AND by finding the persisted PENDING gate part with this
        // gateId in that conversation's uiMessages — the card is the source of truth.
        const conversation = await resolveGateConversation({ mappedConversationId, bodyConversationId, gateId, platformId, userId, log: request.log })
        if (isNil(conversation)) {
            // Nothing routes: no live worker (decision was published but unconsumed) and no parked
            // card to flip. Return an explicit failure so the client keeps the card up rather than
            // dismissing an answer that went nowhere.
            request.log.warn({ gate: { id: gateId } }, '[chatController] Tool approval could not be routed to a conversation')
            return reply.status(StatusCodes.OK).send({ success: false })
        }

        if (conversation.status !== ChatConversationStatus.STREAMING) {
            // Parked/dead turn — no worker is listening. resumeParkedGate flips the card and enqueues
            // a resume (idempotent via the fenced flip).
            await chatResume.resumeParkedGate({ conversation, gateId, approved, payload, log: request.log })
            return reply.status(StatusCodes.OK).send({ success: true })
        }

        // STREAMING: distinguish a live worker (fresh heartbeat) from a dead one (stale heartbeat).
        const msSinceUpdate = Date.now() - new Date(conversation.updated).getTime()
        if (msSinceUpdate <= STREAMING_HEARTBEAT_FRESH_MS) {
            // A live worker will consume the decision we just published; its consumption clears the
            // gate state as today. Nothing more to do.
            return reply.status(StatusCodes.OK).send({ success: true })
        }
        // Dead worker still marked STREAMING and the sweeper hasn't fired yet (Fix 3): run the
        // gate-aware recovery to park the turn (keeps the card, no crash note/budget), then resume it
        // from the answer we just recorded.
        request.log.info({ gate: { id: gateId }, conversation: { id: conversation.id }, msSinceUpdate }, '[chatController] Answer arrived during dead-STREAMING window — recovering then resuming')
        await chatResume.tryEnqueueCrashResume({ conversation, log: request.log })
        const parked = await chatService(request.log).getConversationOrThrow({ id: conversation.id, platformId, userId, skipStaleRecovery: true })
        if (parked.status !== ChatConversationStatus.STREAMING) {
            await chatResume.resumeParkedGate({ conversation: parked, gateId, approved, payload, log: request.log })
        }
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

// A STREAMING conversation whose `updated` was bumped within this window has a live heartbeat, so a
// live worker is presumed to be consuming the gate decision. Past it, the worker is dead and the
// answer must drive recovery itself. Kept below the sweeper's staleness window so a dead worker in
// the answer path is handled here rather than waiting a full sweep cycle.
const STREAMING_HEARTBEAT_FRESH_MS = 60 * 1_000

// Resolve which conversation a gate answer belongs to. Mapping-first (Redis gate:{gateId}); on a
// miss (TTL expiry / Redis restart) fall back to the client-supplied conversationId — but only after
// validating it: the conversation must be scoped to this platform/user AND still carry the PENDING
// gate card for this gateId. Returns null when nothing safely routes.
async function resolveGateConversation({ mappedConversationId, bodyConversationId, gateId, platformId, userId, log }: {
    mappedConversationId: string | null
    bodyConversationId?: string
    gateId: string
    platformId: string
    userId: string
    log: FastifyBaseLogger
}) {
    const conversationId = mappedConversationId ?? bodyConversationId
    if (isNil(conversationId)) {
        return null
    }
    // skipStaleRecovery: recovery is decided explicitly by the caller below (park vs resume), so a
    // read here must not fire a competing crash resume.
    const { data: conversation } = await tryCatch(() => chatService(log).getConversationOrThrow({ id: conversationId, platformId, userId, skipStaleRecovery: true }))
    if (isNil(conversation)) {
        return null
    }
    // The mapping is trusted (it was written for this gate). The body fallback is not, so require the
    // persisted PENDING card to prove this gate really belongs to this conversation.
    if (isNil(mappedConversationId)) {
        const uiMessages = (conversation.uiMessages ?? []) as PersistedChatMessage[]
        if (isNil(chatGateUtils.findPendingGatePart({ uiMessages, gateId }))) {
            log.warn({ gate: { id: gateId }, conversation: { id: conversationId } }, '[chatController] Body-fallback conversationId has no pending gate card for this gate — rejecting')
            return null
        }
    }
    return conversation
}

const FREE_CHAT_CREDIT_USD = 10

async function maybeGrantFreeChatCredits({ platformId, userId, log }: { platformId: string, userId: string, log: FastifyBaseLogger }): Promise<void> {
    // Claim first so the decision is settled exactly once across concurrent messages and paid users
    // stop re-checking after this point (needsCreditDecision becomes false). A losing/duplicate
    // caller exits immediately.
    const claimed = await chatRolloutService.claimFreeCreditGrant({ userId })
    if (!claimed) {
        return
    }
    // Everything after the claim is best-effort and must never fail the user's message. Any error —
    // the plan lookup or the top-up — rolls the claim back so a later message retries
    // (needsCreditDecision goes true again). Paid platforms (license key) keep the claim with no
    // grant owed, so they stop re-checking.
    const { error } = await tryCatch(async () => {
        const plan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        if (isNil(plan.licenseKey)) {
            await platformAiCreditsService(log).grantFreeChatCredits({ platformId, amountUsd: FREE_CHAT_CREDIT_USD })
        }
    })
    if (!isNil(error)) {
        await tryCatch(() => chatRolloutService.releaseFreeCreditGrant({ userId }))
        log.error({ error, platform: { id: platformId }, user: { id: userId } }, '[chatController] Failed to grant free chat credits')
    }
}

async function assertAiCreditsNotExhausted({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<void> {
    const chatProvider = await aiProviderService(log).getChatProvider({ platformId })
    if (!chatProvider || chatProvider.provider !== AIProviderName.ACTIVEPIECES) {
        return
    }
    const usage = await platformAiCreditsService(log).getUsage(platformId)
    if (usage.usageRemaining <= 0) {
        log.warn({ usage: usage.usage, limit: usage.limit }, '[chatController] AI credits exhausted, rejecting message')
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

const FunnelLandingRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
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
        body: z.object({ approved: z.boolean(), payload: z.record(z.string(), z.unknown()).optional(), conversationId: z.string().optional() }),
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

