import { PlatformCopilotChatRequest, PrincipalType } from '@activepieces/shared'
import { RateLimitOptions } from '@fastify/rate-limit'
import { createUIMessageStream, pipeUIMessageStreamToResponse, stepCountIs, streamText, UI_MESSAGE_STREAM_HEADERS } from 'ai'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { createCopilotTools } from './platform-copilot-tools'
import { platformCopilotService } from './platform-copilot.service'

const MAX_MESSAGE_CHARS = 4000
const MAX_HISTORY_CONTENT_CHARS = 8000
const MAX_HISTORY_MESSAGES = 50

export const platformCopilotController: FastifyPluginAsyncZod = async (app) => {
    app.post('/chat', ChatRequest, async (request, reply) => {
        const { model, system: systemPrompt, messages } = platformCopilotService().prepareChat({
            message: request.body.message,
            conversationHistory: request.body.conversationHistory,
        })

        const stream = createUIMessageStream({
            execute: async ({ writer }) => {
                const tools = createCopilotTools()
                const result = streamText({
                    model,
                    system: systemPrompt,
                    messages,
                    tools,
                    stopWhen: stepCountIs(10),
                })

                writer.merge(result.toUIMessageStream())
                await result.consumeStream()
            },
            onError: (error) => {
                app.log.error(error, '[platformCopilotController] stream error')
                return 'An error occurred while generating the response.'
            },
        })

        void reply.hijack()
        pipeUIMessageStreamToResponse({
            response: reply.raw,
            stream,
            headers: { ...UI_MESSAGE_STREAM_HEADERS },
        })
    })
}

const rateLimitOptions: RateLimitOptions = {
    max: Number.parseInt(
        system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_MAX),
        10,
    ),
    timeWindow: system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_WINDOW),
}

const ChatRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
        rateLimit: rateLimitOptions,
    },
    schema: {
        tags: ['platform-copilot'],
        description: 'Send a message to the Activepieces platform assistant (streams UI message stream format)',
        body: z.object({
            message: z.string().min(1).max(MAX_MESSAGE_CHARS),
            conversationHistory: z.array(
                z.object({
                    role: z.enum(['user', 'assistant']),
                    content: z.string().max(MAX_HISTORY_CONTENT_CHARS),
                }),
            ).max(MAX_HISTORY_MESSAGES).default([]),
        } satisfies Record<keyof PlatformCopilotChatRequest, unknown>),
    },
}
