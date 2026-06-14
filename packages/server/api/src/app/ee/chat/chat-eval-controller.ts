import {
    apId,
    ChatConversationStatus,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    SimulateChatRequest,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { chatApprovalGate } from './chat-approval-gate'
import { chatService } from './chat-service'
import { chatPrompt } from './prompt/chat-prompt'

const SIMULATION_POLL_INTERVAL_MS = 1_500
const SIMULATION_MAX_ATTEMPTS = 80

export const chatEvalController: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.chatPlaygroundEnabled === true))

    app.get('/eval/prompt-sources', PromptSourcesRoute, async (_request, reply) => {
        return reply.status(StatusCodes.OK).send(chatPrompt.sources)
    })

    app.post('/eval/simulate', SimulateRoute, async (request, reply) => {
        const log = request.log
        const platformId = request.principal.platform.id
        const sandboxUserId = system.getOrThrow(AppSystemProp.CHAT_PLAYGROUND_SANDBOX_USER_ID)
        const sandboxProjectId = system.getOrThrow(AppSystemProp.CHAT_PLAYGROUND_SANDBOX_PROJECT_ID)
        const { userMessage, promptOverride, modelName } = request.body

        const conversation = await chatService(log).createConversation({
            platformId,
            userId: sandboxUserId,
            projectId: sandboxProjectId,
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
                projectId: sandboxProjectId,
                platformId,
                userId: sandboxUserId,
                userMessage,
                modelName: modelName ?? null,
                promptOverride,
            },
        })

        const settled = await waitForSimulationResult({ conversationId: conversation.id, platformId, userId: sandboxUserId, log })
        return reply.status(StatusCodes.OK).send({
            conversationId: conversation.id,
            runId,
            status: settled.status,
            uiMessages: settled.uiMessages ?? [],
        })
    })
}

async function waitForSimulationResult({ conversationId, platformId, userId, log }: { conversationId: string, platformId: string, userId: string, log: FastifyBaseLogger }): Promise<{ status: ChatConversationStatus, uiMessages: unknown[] | null }> {
    for (let attempt = 0; attempt < SIMULATION_MAX_ATTEMPTS; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, SIMULATION_POLL_INTERVAL_MS))
        const conversation = await chatService(log).getConversationOrThrow({ id: conversationId, platformId, userId })
        const uiMessages = conversation.uiMessages ?? null
        if (conversation.status === ChatConversationStatus.ERROR) {
            return { status: conversation.status, uiMessages }
        }
        if (conversation.status === ChatConversationStatus.IDLE && (uiMessages?.length ?? 0) > 0) {
            return { status: conversation.status, uiMessages }
        }
    }
    const finalConversation = await chatService(log).getConversationOrThrow({ id: conversationId, platformId, userId })
    return { status: finalConversation.status, uiMessages: finalConversation.uiMessages ?? null }
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
