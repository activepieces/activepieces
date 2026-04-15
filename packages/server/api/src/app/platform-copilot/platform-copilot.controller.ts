import { PlatformCopilotChatRequest, PrincipalType } from '@activepieces/shared'
import { createUIMessageStream, pipeUIMessageStreamToResponse, stepCountIs, streamText, UI_MESSAGE_STREAM_HEADERS } from 'ai'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { platformCopilotIndexer } from './platform-copilot-indexer'
import { createCopilotTools } from './platform-copilot-tools'
import { platformCopilotService } from './platform-copilot.service'

export const platformCopilotController: FastifyPluginAsyncZod = async (app) => {
    app.post('/chat', ChatRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const { model, systemWithContext, messages } = await platformCopilotService(app.log).prepareChat({
            platformId,
            message: request.body.message,
            conversationHistory: request.body.conversationHistory,
            modelId: request.body.modelId,
            provider: request.body.provider,
        })

        const stream = createUIMessageStream({
            execute: async ({ writer }) => {
                const tools = createCopilotTools({ platformId })
                const result = streamText({
                    model,
                    system: systemWithContext,
                    messages,
                    tools,
                    stopWhen: stepCountIs(5),
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

    app.post('/index', IndexRequest, async (_request) => {
        const indexer = platformCopilotIndexer(app.log)
        indexer.reindex().catch((err: unknown) => app.log.error(err, '[platformCopilotController] re-index failed'))
        return { status: 'indexing_started' }
    })
}

const IndexRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['platform-copilot'],
        description: 'Trigger re-indexing of Activepieces docs and codebase',
        response: {
            200: z.object({
                status: z.string(),
            }),
        },
    },
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
            modelId: z.string().optional(),
            provider: z.string().optional(),
        } satisfies Record<keyof PlatformCopilotChatRequest, unknown> & Record<string, unknown>),
    },
}
