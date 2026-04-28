import { ApEdition, isNil, PLATFORM_COPILOT_LIMITS, PlatformCopilotChatRequest, PlatformCopilotErrorCode, PrincipalType } from '@activepieces/shared'
import { RateLimitOptions } from '@fastify/rate-limit'
import { createUIMessageStream, pipeUIMessageStreamToResponse, stepCountIs, streamText, UI_MESSAGE_STREAM_HEADERS } from 'ai'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { system } from '../helper/system/system'
import { copilotCloudProxyService, isSelfHostedEdition } from './platform-copilot-cloud-proxy.service'
import { runModeration } from './platform-copilot-moderation'
import { copilotRateLimiter, estimateUsageCents } from './platform-copilot-rate-limiter.service'
import { platformCopilotRegistryService } from './platform-copilot-registry.service'
import { createCopilotTools } from './platform-copilot-tools'
import { platformCopilotService } from './platform-copilot.service'

const ChatBodySchema = z.object({
    message: z.string().min(1).max(PLATFORM_COPILOT_LIMITS.maxMessageChars),
    conversationHistory: z.array(
        z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string().max(PLATFORM_COPILOT_LIMITS.maxHistoryContentChars),
        }),
    ).max(PLATFORM_COPILOT_LIMITS.maxHistoryMessages).default([]),
} satisfies Record<keyof PlatformCopilotChatRequest, unknown>)

const RegisterBodySchema = z.object({
    platformId: z.string().min(1).max(64),
    edition: z.enum([ApEdition.COMMUNITY, ApEdition.ENTERPRISE, ApEdition.CLOUD]),
    version: z.string().min(1).max(32),
})

export const platformCopilotController: FastifyPluginAsyncZod = async (app) => {
    app.post('/chat', ChatRequestOptions, async (request, reply) => {
        const userAllowance = await copilotRateLimiter.checkAndRecordUserAllowance({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
        if (!userAllowance.allowed) {
            return reply
                .header('Retry-After', userAllowance.retryAfterSeconds.toString())
                .status(StatusCodes.TOO_MANY_REQUESTS)
                .send({ error: PlatformCopilotErrorCode.USER_HOURLY_LIMIT_REACHED })
        }

        if (isSelfHostedEdition()) {
            await copilotCloudProxyService.forwardChat({
                platformId: request.principal.platform.id,
                body: request.body,
                reply,
                log: request.log,
            })
            return
        }
        await runChatStream({
            body: request.body,
            log: request.log,
            reply,
            platformId: request.principal.platform.id,
        })
    })

    if (system.getEdition() === ApEdition.CLOUD) {
        app.post('/proxy-chat', ProxyChatRequestOptions, async (request, reply) => {
            const auth = await authenticateProxyChat(request)
            if (!auth.ok) {
                return reply.status(auth.status).send({ error: auth.errorCode })
            }
            await runChatStream({
                body: request.body,
                log: request.log,
                reply,
                platformId: auth.platformId,
            })
        })

        app.post('/register', RegisterRequestOptions, async (request, reply) => {
            const { platformId, edition, version } = request.body
            const result = await platformCopilotRegistryService.register({ platformId, edition, version })
            return reply.status(StatusCodes.OK).send(result)
        })
    }
}

const runChatStream = async ({ body, log, reply, platformId }: {
    body: PlatformCopilotChatRequest
    log: FastifyBaseLogger
    reply: FastifyReply
    platformId: string
}): Promise<void> => {
    const [platformAllowance, globalAllowance, moderation] = await Promise.all([
        copilotRateLimiter.checkPlatformAllowance(platformId),
        copilotRateLimiter.checkGlobalAllowance(),
        runModeration({ input: body.message, log }),
    ])
    if (!platformAllowance.allowed) {
        return reply
            .header('Retry-After', platformAllowance.retryAfterSeconds.toString())
            .status(StatusCodes.TOO_MANY_REQUESTS)
            .send({ error: PlatformCopilotErrorCode.PLATFORM_DAILY_LIMIT_REACHED })
    }
    if (!globalAllowance.allowed) {
        return reply
            .header('Retry-After', globalAllowance.retryAfterSeconds.toString())
            .status(StatusCodes.SERVICE_UNAVAILABLE)
            .send({ error: PlatformCopilotErrorCode.SERVICE_PAUSED })
    }
    if (moderation.flagged) {
        return reply.status(StatusCodes.BAD_REQUEST).send({
            error: PlatformCopilotErrorCode.CONTENT_POLICY,
        })
    }

    const { model, system: systemPrompt, messages } = platformCopilotService().prepareChat({
        message: body.message,
        conversationHistory: body.conversationHistory,
    })

    await copilotRateLimiter.recordPlatformMessage(platformId)

    const stream = createUIMessageStream({
        execute: async ({ writer }) => {
            const tools = createCopilotTools()
            const result = streamText({
                model,
                system: systemPrompt,
                messages,
                tools,
                stopWhen: stepCountIs(10),
                onFinish: async ({ usage }) => {
                    const inputTokens = usage.inputTokens ?? 0
                    const outputTokens = usage.outputTokens ?? 0
                    const totalTokens = usage.totalTokens ?? inputTokens + outputTokens
                    await copilotRateLimiter.recordPlatformTokens({ platformId, totalTokens })
                    await copilotRateLimiter.recordGlobalCost(estimateUsageCents({ inputTokens, outputTokens }))
                },
            })
            writer.merge(result.toUIMessageStream())
            await result.consumeStream()
        },
        onError: (error) => {
            log.error(error, '[platformCopilotController] stream error')
            return 'An error occurred while generating the response.'
        },
    })

    void reply.hijack()
    pipeUIMessageStreamToResponse({
        response: reply.raw,
        stream,
        headers: { ...UI_MESSAGE_STREAM_HEADERS },
    })
}

type ProxyChatAuthSuccess = { ok: true, platformId: string }
type ProxyChatAuthFailure = { ok: false, status: number, errorCode: PlatformCopilotErrorCode }

const authenticateProxyChat = async (request: FastifyRequest): Promise<ProxyChatAuthSuccess | ProxyChatAuthFailure> => {
    const authHeader = request.headers.authorization
    const platformId = request.headers['x-ap-platform-id']

    if (typeof platformId !== 'string' || isNil(authHeader) || !authHeader.startsWith('Bearer ')) {
        return { ok: false, status: StatusCodes.UNAUTHORIZED, errorCode: PlatformCopilotErrorCode.UNAUTHORIZED }
    }

    const copilotApiKey = authHeader.slice('Bearer '.length).trim()
    if (copilotApiKey.length === 0) {
        return { ok: false, status: StatusCodes.UNAUTHORIZED, errorCode: PlatformCopilotErrorCode.UNAUTHORIZED }
    }

    const result = await platformCopilotRegistryService.validateAndTouch({ copilotApiKey, platformId })
    if (result.status === 'unknown') {
        return { ok: false, status: StatusCodes.UNAUTHORIZED, errorCode: PlatformCopilotErrorCode.UNAUTHORIZED }
    }
    if (result.status === 'blocked') {
        return { ok: false, status: StatusCodes.FORBIDDEN, errorCode: PlatformCopilotErrorCode.PLATFORM_UNAVAILABLE }
    }
    return { ok: true, platformId }
}

const ChatRequestOptions = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['platform-copilot'],
        description: 'Send a message to the Activepieces copilot (streams UI message stream format)',
        body: ChatBodySchema,
    },
}

const ProxyChatRequestOptions = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['platform-copilot'],
        description: 'Proxied chat for self-hosted Activepieces servers (Cloud-only).',
        body: ChatBodySchema,
    },
}

const RegisterRateLimit: RateLimitOptions = {
    max: 5,
    timeWindow: '1 hour',
}

const RegisterRequestOptions = {
    config: {
        security: securityAccess.public(),
        rateLimit: RegisterRateLimit,
    },
    schema: {
        tags: ['platform-copilot'],
        description: 'Register a self-hosted platform with the Activepieces Cloud copilot service (Cloud-only).',
        body: RegisterBodySchema,
    },
}
