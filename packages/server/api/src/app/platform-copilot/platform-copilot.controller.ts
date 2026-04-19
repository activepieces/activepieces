import { PlatformCopilotChatRequest, PrincipalType } from '@activepieces/shared'
import { createUIMessageStream, pipeUIMessageStreamToResponse, stepCountIs, streamText, UI_MESSAGE_STREAM_HEADERS } from 'ai'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { createCopilotTools } from './platform-copilot-tools'
import { platformCopilotService } from './platform-copilot.service'

export const platformCopilotController: FastifyPluginAsyncZod = async (app) => {
    app.post('/chat', ChatRequest, async (request, reply) => {
        const { model, system, messages } = platformCopilotService().prepareChat({
            message: request.body.message,
            conversationHistory: request.body.conversationHistory,
        })

        const stream = createUIMessageStream({
            execute: async ({ writer }) => {
                const tools = createCopilotTools()
                const result = streamText({
                    model,
                    system,
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

const ChatRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['platform-copilot'],
        description: 'Send a message to the Activepieces platform assistant (streams UI message stream format)',
        body: z.object({
            message: z.string().min(1),
            conversationHistory: z.array(
                z.object({
                    role: z.enum(['user', 'assistant']),
                    content: z.string(),
                }),
            ).default([]),
        } satisfies Record<keyof PlatformCopilotChatRequest, unknown>),
    },
}
