import {
    UpdateChatbotRequest,
    ListChatbotsRequest,
    CreateChatBotRequest,
    APChatMessage,
} from '@activepieces/shared'
import {
    FastifyPluginCallbackTypebox,
    Static,
    Type,
} from '@fastify/type-provider-typebox'
import { FastifyInstance } from 'fastify'
import { chatbotService } from './chatbot.service'
import { datasourceController } from './datasources/datasource.controller'

const ChatBotIdParams = Type.Object({
    id: Type.String(),
})

type ChatBotIdParams = Static<typeof ChatBotIdParams>

export const chatbotModule = async (app: FastifyInstance) => {
    await app.register(chatbotController, { prefix: '/v1/chatbots' })
    await app.register(datasourceController, { prefix: '/v1/chatbots' })
}

export const chatbotController: FastifyPluginCallbackTypebox = (
    app,
    _opts,
    done,
) => {
    app.post(
        '/',
        {
            schema: {
                body: CreateChatBotRequest,
            },
        },
        async (request) => {
            return chatbotService.save({
                projectId: request.principal.projectId,
                request: request.body,
            })
        },
    )
    app.get(
        '/',
        {
            schema: {
                querystring: ListChatbotsRequest,
            },
        },
        async (request) => {
            return chatbotService.list({
                projectId: request.principal.projectId,
                limit: request.query.limit ?? 10,
                cursorRequest: request.query.cursor ?? null,
            })
        },
    ),
    app.get(
        '/:id/metadata',
        {
            schema: {
                params: ChatBotIdParams,
            },
        },
        async (request) => {
            return chatbotService.getMetadata({
                id: request.params.id,
                projectId: request.principal.projectId,
            })
        },
    ),
    app.get(
        '/:id',
        {
            schema: {
                params: ChatBotIdParams,
            },
        },
        async (request) => {
            return chatbotService.getOneOrThrow({
                id: request.params.id,
                projectId: request.principal.projectId,
            })
        },
    ),
    app.post(
        '/:id',
        {
            schema: {
                params: ChatBotIdParams,
                body: UpdateChatbotRequest,
            },
        },
        async (request) => {
            return chatbotService.update({
                projectId: request.principal.projectId,
                request: request.body,
                chatbotId: request.params.id,
            })
        },
    ),
    app.post(
        '/:id/ask',
        {
            schema: {
                params: ChatBotIdParams,
                body: Type.Object({
                    input: Type.String(),
                    history: Type.Optional(Type.Array(APChatMessage)),
                }),
            },
        },
        async (request) => {
            return chatbotService.ask({
                projectId: request.principal.projectId,
                chatbotId: request.params.id,
                input: request.body.input,
                history: request.body.history ?? [],
            })
        },
    ),
    app.delete(
        '/:id',
        { schema: { params: ChatBotIdParams } },
        async (request) => {
            return chatbotService.delete({
                projectId: request.principal.projectId,
                chatbotId: request.params.id,
            })
        },
    ),


    done()
}
