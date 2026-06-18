import {
    ActivepiecesError,
    apId,
    ChatConversationStatus,
    ErrorCode,
    isNil,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    PersistedChatRole,
    SimulateChatRequest,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { platformService } from '../../platform/platform.service'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { chatApprovalGate } from './chat-approval-gate'
import { chatHelpers } from './chat-helpers'
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

        // dryRun runs as the platform owner with tools disabled — no side effects. Gate it behind
        // the same chatEnabled plan flag the production chat path requires, so the eval can't run the
        // chat loop for a platform that isn't entitled to it.
        const platform = await platformService(log).getOneWithPlanOrThrow(platformId)
        if (!platform.plan.chatEnabled) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: { message: 'Chat is disabled for this platform' },
            })
        }
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
            await chatApprovalGate.storeActiveRunId({ conversationId: conversation.id, runId: lastRunId })
            await jobQueue(log).add({
                id: apId(),
                type: JobType.ONE_TIME,
                data: {
                    schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                    jobType: WorkerJobType.EXECUTE_CHAT_AGENT,
                    conversationId: conversation.id,
                    runId: lastRunId,
                    projectId: null,
                    platformId,
                    userId: evalUserId,
                    userMessage: turn,
                    modelName: null,
                    promptOverride,
                    dryRun: true,
                },
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
