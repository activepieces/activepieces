import { apId, isNil } from '@activepieces/core-utils'
import { ChatConversationStatus, ChatPromptOverride, PersistedChatRole, SimulateChatRequest } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { platformService } from '../../platform/platform.service'
import { chatHelpers, EVAL_CONVERSATION_ID_PREFIX, isEvalConversationId } from './chat-helpers'
import { chatJob } from './chat-job'
import { chatService } from './chat-service'
import { chatPrompt } from './prompt/chat-prompt'

const API_KEY_HEADER = 'api-key'
const API_KEY = system.get(AppSystemProp.API_KEY)
const SIMULATION_POLL_INTERVAL_MS = 1_500
const SIMULATION_MAX_ATTEMPTS = 120
const SIMULATION_TIMEOUT_STATUS = 'TIMEOUT'

type SimulationStatus = ChatConversationStatus | typeof SIMULATION_TIMEOUT_STATUS

// Same guard as admin-platform.controller: a single global AP_API_KEY, not a per-platform key.
async function checkApiKeyPreHandler(req: FastifyRequest, res: FastifyReply): Promise<void> {
    const key = req.headers[API_KEY_HEADER] as string | undefined
    if (isNil(API_KEY) || key !== API_KEY) {
        await res.status(StatusCodes.FORBIDDEN).send({ message: 'Forbidden' })
        throw new Error('Forbidden')
    }
}

export const chatEvalModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', checkApiKeyPreHandler)
    await app.register(chatEvalController, { prefix: '/v1/chat' })
}

const chatEvalController: FastifyPluginAsyncZod = async (app) => {
    app.get('/eval/prompt-sources', PromptSourcesRoute, async (_request, reply) => {
        return reply.status(StatusCodes.OK).send(chatPrompt.sources)
    })

    // Lets a caller replaying a foreign conversation (e.g. the console in dev, where the
    // conversation's real platform lives in cloud) resolve a local platform to sandbox the run in.
    app.get('/eval/sandbox-platform', SandboxPlatformRoute, async (request, reply) => {
        const platform = await platformService(request.log).getOldestPlatform()
        if (isNil(platform)) {
            return reply.status(StatusCodes.NOT_FOUND).send({ message: 'No platform exists on this instance' })
        }
        return reply.status(StatusCodes.OK).send({ platformId: platform.id })
    })

    app.post('/eval/simulate', SimulateRoute, async (request, reply) => {
        const log = request.log
        const { platformId, userMessage, userMessages, promptOverride } = request.body
        const turns = userMessages ?? [userMessage as string]

        // Eval is an internal api-key dry-run, so it doesn't require the platform's chatEnabled entitlement.
        const platform = await platformService(log).getOneOrThrow(platformId)
        const evalUserId = platform.ownerId

        const conversation = await chatService(log).createConversation({
            platformId,
            userId: evalUserId,
            request: {},
        })

        // Replay the turns sequentially in one conversation: each turn's history accumulates,
        // so the candidate prompt is exercised across the whole conversation.
        let lastRunId = ''
        let settled: { status: SimulationStatus, uiMessages: unknown[] | null } = { status: SIMULATION_TIMEOUT_STATUS, uiMessages: null }
        let priorAssistantTurns = 0
        for (const turn of turns) {
            lastRunId = apId()
            await chatJob.enqueueChatAgentJob({
                conversationId: conversation.id,
                runId: lastRunId,
                projectId: null,
                platformId,
                userId: evalUserId,
                userMessage: turn,
                modelName: null,
                promptOverride,
                dryRun: true,
                log,
            })

            settled = await waitForSimulationResult({ conversationId: conversation.id, platformId, userId: evalUserId, priorAssistantTurns, log })
            if (settled.status === ChatConversationStatus.ERROR || settled.status === SIMULATION_TIMEOUT_STATUS) {
                break
            }
            priorAssistantTurns = countAssistantTurns(settled.uiMessages)
        }

        return reply.status(StatusCodes.OK).send({
            conversationId: conversation.id,
            runId: lastRunId,
            status: settled.status,
            uiMessages: settled.uiMessages ?? [],
        })
    })

    // Enqueue one turn and return; the caller polls /state for progress. Dry-run by default (tools
    // not executed); pass executeTools:true to run tools live against the owner's real connections.
    app.post('/eval/turn/start', EvalTurnStartRoute, async (request, reply) => {
        const log = request.log
        const { conversationId, platformId, userMessage, promptOverride, executeTools, discoveryOnly } = request.body

        let convId: string
        let evalPlatformId: string
        let evalUserId: string
        let priorAssistantTurns: number
        if (!isNil(conversationId)) {
            // Only continue conversations this eval flow created — never an arbitrary (e.g. a real
            // user's) conversation, even with a valid API key.
            if (!isEvalConversationId(conversationId)) {
                return reply.status(StatusCodes.NOT_FOUND).send({ message: 'Conversation not found' })
            }
            const existing = await chatHelpers.conversationRepo().findOneBy({ id: conversationId })
            if (isNil(existing)) {
                return reply.status(StatusCodes.NOT_FOUND).send({ message: 'Conversation not found' })
            }
            // Reject overlapping turns: a turn is already in flight for this conversation. The caller
            // serializes turns, so this only fires on a double-submit — don't race two workers on one row.
            if (existing.status === ChatConversationStatus.STREAMING) {
                return reply.status(StatusCodes.CONFLICT).send({ message: 'A turn is already running for this conversation' })
            }
            convId = existing.id
            evalPlatformId = existing.platformId
            evalUserId = existing.userId
            priorAssistantTurns = countAssistantTurns(existing.uiMessages)
        }
        else {
            if (isNil(platformId)) {
                return reply.status(StatusCodes.BAD_REQUEST).send({ message: 'platformId is required to start a new conversation' })
            }
            const platform = await platformService(log).getOneOrThrow(platformId)
            evalPlatformId = platformId
            evalUserId = platform.ownerId
            const conversation = await chatService(log).createConversation({ platformId, userId: evalUserId, request: {}, id: (EVAL_CONVERSATION_ID_PREFIX + apId()).slice(0, 21) })
            convId = conversation.id
            priorAssistantTurns = 0
        }

        const runId = apId()
        await chatJob.enqueueChatAgentJob({
            conversationId: convId,
            runId,
            projectId: null,
            platformId: evalPlatformId,
            userId: evalUserId,
            userMessage,
            modelName: null,
            promptOverride,
            // discovery-only still needs the real tool set (dry-run strips MCP piece tools
            // entirely), so it runs non-dry but with execution neutralized in the worker.
            dryRun: executeTools !== true && discoveryOnly !== true,
            discoveryOnly: discoveryOnly === true,
            log,
        })

        return reply.status(StatusCodes.OK).send({ conversationId: convId, runId, priorAssistantTurns })
    })

    // Pure observer of an eval conversation's live state — read the row directly (not
    // getConversationOrThrow, which resets a stale STREAMING row to IDLE).
    app.get('/eval/conversations/:conversationId/state', EvalStateRoute, async (request, reply) => {
        if (!isEvalConversationId(request.params.conversationId)) {
            return reply.status(StatusCodes.NOT_FOUND).send({ message: 'Conversation not found' })
        }
        const conversation = await chatHelpers.conversationRepo().findOneBy({ id: request.params.conversationId })
        if (isNil(conversation)) {
            return reply.status(StatusCodes.NOT_FOUND).send({ message: 'Conversation not found' })
        }
        return reply.status(StatusCodes.OK).send({
            status: conversation.status,
            uiMessages: conversation.uiMessages ?? [],
        })
    })
}

async function waitForSimulationResult({ conversationId, platformId, userId, priorAssistantTurns, log }: { conversationId: string, platformId: string, userId: string, priorAssistantTurns: number, log: FastifyBaseLogger }): Promise<{ status: SimulationStatus, uiMessages: unknown[] | null }> {
    // Read the row directly, not via getConversationOrThrow (which resets a stale STREAMING
    // conversation to IDLE), so the poller stays a pure observer.
    for (let attempt = 0; attempt < SIMULATION_MAX_ATTEMPTS; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, SIMULATION_POLL_INTERVAL_MS))
        const settled = readSettledState(await chatHelpers.conversationRepo().findOneBy({ id: conversationId, platformId, userId }), priorAssistantTurns)
        if (settled) {
            return settled
        }
    }
    log.warn({ conversation: { id: conversationId } }, 'Chat simulation timed out before completing')
    return { status: SIMULATION_TIMEOUT_STATUS, uiMessages: null }
}

function readSettledState(conversation: { status: ChatConversationStatus, uiMessages: unknown[] | null } | null, priorAssistantTurns: number): { status: ChatConversationStatus, uiMessages: unknown[] | null } | null {
    if (!conversation) {
        return null
    }
    const uiMessages = conversation.uiMessages ?? null
    if (conversation.status === ChatConversationStatus.ERROR) {
        return { status: conversation.status, uiMessages }
    }
    // Settle only once THIS turn's assistant reply has landed: the user message is persisted at
    // the start, and earlier turns already left assistant messages, so we wait for the assistant
    // count to grow past the count we had before this turn.
    if (conversation.status === ChatConversationStatus.IDLE && countAssistantTurns(uiMessages) > priorAssistantTurns) {
        return { status: conversation.status, uiMessages }
    }
    return null
}

function countAssistantTurns(uiMessages: unknown[] | null): number {
    return (uiMessages ?? []).filter((message) =>
        typeof message === 'object' && message !== null && 'role' in message && message.role === PersistedChatRole.ASSISTANT,
    ).length
}

const PromptSourcesRoute = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['chat'],
    },
}

const SandboxPlatformRoute = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['chat'],
    },
}

const SimulateRoute = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['chat'],
        body: SimulateChatRequest,
    },
}

const EvalTurnStartRequest = z.object({
    conversationId: z.string().optional(),
    platformId: z.string().optional(),
    userMessage: z.string().min(1).max(51200),
    promptOverride: ChatPromptOverride.optional(),
    // Opt-in (default off): run the turn with tools actually executing against the platform
    // owner's real connections, instead of the dry-run playground stub. The failure-mode eval
    // harness needs real discovery/execution results to measure how the agent uses pieces;
    // dry-run returns "not executed" for every cross-project tool, which hides piece-use behavior.
    executeTools: z.boolean().optional(),
    // Opt-in (default off): real discovery, but ap_execute_action neutralized and approval gates
    // auto-resolved — measures how the agent navigates to a runnable call with zero side effects.
    discoveryOnly: z.boolean().optional(),
})

const EvalStateParams = z.object({
    conversationId: z.string(),
})

const EvalTurnStartRoute = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['chat'],
        body: EvalTurnStartRequest,
    },
}

const EvalStateRoute = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['chat'],
        params: EvalStateParams,
    },
}
