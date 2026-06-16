import {
    apId,
    ChatConversationStatus,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    PersistedChatRole,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    SimulateChatRequest,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { platformService } from '../../platform/platform.service'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { chatApprovalGate } from './chat-approval-gate'
import { chatHelpers } from './chat-helpers'
import { chatService } from './chat-service'
import { chatPrompt } from './prompt/chat-prompt'

const SIMULATION_POLL_INTERVAL_MS = 1_500
const SIMULATION_MAX_ATTEMPTS = 120
const SIMULATION_TIMEOUT_STATUS = 'TIMEOUT'

type SimulationStatus = ChatConversationStatus | typeof SIMULATION_TIMEOUT_STATUS

export const chatEvalController: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.chatPlaygroundEnabled === true))

    app.get('/eval/prompt-sources', PromptSourcesRoute, async (_request, reply) => {
        return reply.status(StatusCodes.OK).send(chatPrompt.sources)
    })

    app.post('/eval/simulate', SimulateRoute, async (request, reply) => {
        const log = request.log
        const platformId = request.principal.platform.id
        const { userMessage, promptOverride, modelName } = request.body

        // dryRun runs as the platform owner with tools disabled — no side effects, no sandbox.
        const platform = await platformService(log).getOneOrThrow(platformId)
        const evalUserId = platform.ownerId

        const conversation = await chatService(log).createConversation({
            platformId,
            userId: evalUserId,
            request: { modelName: modelName ?? null },
        })

        const runId = apId()
        await chatApprovalGate.storeActiveRunId({ conversationId: conversation.id, runId })
        await jobQueue(log).add({
            id: apId(),
            type: JobType.ONE_TIME,
            data: {
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                jobType: WorkerJobType.EXECUTE_CHAT_AGENT,
                conversationId: conversation.id,
                runId,
                projectId: null,
                platformId,
                userId: evalUserId,
                userMessage,
                modelName: modelName ?? null,
                promptOverride,
                dryRun: true,
            },
        })

        const settled = await waitForSimulationResult({ conversationId: conversation.id, platformId, userId: evalUserId, log })
        return reply.status(StatusCodes.OK).send({
            conversationId: conversation.id,
            runId,
            status: settled.status,
            uiMessages: settled.uiMessages ?? [],
        })
    })
}

async function waitForSimulationResult({ conversationId, platformId, userId, log }: { conversationId: string, platformId: string, userId: string, log: FastifyBaseLogger }): Promise<{ status: SimulationStatus, uiMessages: unknown[] | null }> {
    // Read the row directly, not via getConversationOrThrow (which resets a stale STREAMING
    // conversation to IDLE), so the poller stays a pure observer.
    for (let attempt = 0; attempt < SIMULATION_MAX_ATTEMPTS; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, SIMULATION_POLL_INTERVAL_MS))
        const settled = readSettledState(await chatHelpers.conversationRepo().findOneBy({ id: conversationId, platformId, userId }))
        if (settled) {
            return settled
        }
    }
    log.warn({ conversationId }, 'Chat simulation timed out before completing')
    return { status: SIMULATION_TIMEOUT_STATUS, uiMessages: null }
}

function readSettledState(conversation: { status: ChatConversationStatus, uiMessages: unknown[] | null } | null): { status: ChatConversationStatus, uiMessages: unknown[] | null } | null {
    if (!conversation) {
        return null
    }
    const uiMessages = conversation.uiMessages ?? null
    if (conversation.status === ChatConversationStatus.ERROR) {
        return { status: conversation.status, uiMessages }
    }
    // Wait for an assistant turn: the user message is persisted at the start, so IDLE +
    // messages alone would falsely settle before the assistant responds.
    if (conversation.status === ChatConversationStatus.IDLE && hasAssistantMessage(uiMessages)) {
        return { status: conversation.status, uiMessages }
    }
    return null
}

function hasAssistantMessage(uiMessages: unknown[] | null): boolean {
    return (uiMessages ?? []).some((message) =>
        typeof message === 'object' && message !== null && 'role' in message && message.role === PersistedChatRole.ASSISTANT,
    )
}

const PromptSourcesRoute = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.SERVICE, PrincipalType.USER]),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}

const SimulateRoute = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.SERVICE, PrincipalType.USER]),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: SimulateChatRequest,
    },
}
