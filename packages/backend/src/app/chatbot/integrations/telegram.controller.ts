
import { AppConnectionType, SecretKeyAppConnection, TelegramWebhookRequest } from '@activepieces/shared'
import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { chatbotService } from '../chatbot.service'
import { appConnectionService } from '../../app-connection/app-connection-service'
import { telegramIntegration } from './telegram.chatbot'

export const telegramController: FastifyPluginCallbackTypebox = (
    app,
    _opts,
    done,
) => {

    app.post(
        '/:id/telegram',
        {
            schema: {
                params: Type.Object({
                    id: Type.String(),
                }),
                body: Type.Object({
                    botToken: Type.String(),
                }),
            },
        },
        async (request) => {
            const chatbot = await chatbotService.getOneOrThrow({
                projectId: request.principal.projectId,
                chatbotId: request.params.id,
            })
            await appConnectionService.upsert({
                projectId: request.principal.projectId,
                request: {
                    name: `chatbot-${chatbot.id}-telegram`,
                    appName: '@activepieces/piece-telegram-bot',
                    value: {
                        type: AppConnectionType.SECRET_TEXT,
                        secret_text: request.body.botToken,
                    },
                },
            })
            await telegramIntegration.subscribeWebhook(
                request.body.botToken,
                chatbot.id,
                request.principal.projectId,
            )
            return chatbot
        },
    )

    app.delete(
        '/:id/telegram',
        {
            schema: {
                params: Type.Object({
                    id: Type.String(),
                }),
            },
        },
        async (request) => {
            const chatbot = await chatbotService.getOneOrThrow({
                projectId: request.principal.projectId,
                chatbotId: request.params.id,
            })
            const connection = await appConnectionService.getOneOrThrow({
                projectId: request.principal.projectId,
                name: `chatbot-${chatbot.id}-telegram`,
            })
            const botToken = (connection as SecretKeyAppConnection).value.secret_text
            await telegramIntegration.unsubscribeWebhook(botToken)
            return chatbot
        },
    )

    app.post(
        '/:id/telegram/webhook',
        {
            schema: {
                params: Type.Object({
                    id: Type.String(),
                }),
                querystring: Type.Object({
                    projectId: Type.String(),
                }),
                body: TelegramWebhookRequest,
            },
        },
        async (request) => {
            const reply = await chatbotService.ask({
                projectId: request.query.projectId,
                chatbotId: request.params.id,
                input: request.body.message.text,
            })
            const connection = await appConnectionService.getOneOrThrow({
                projectId: request.query.projectId,
                name: `chatbot-${request.params.id}-telegram`,
            })
            const botToken = (connection as SecretKeyAppConnection).value.secret_text

            return telegramIntegration.sendMessage(
                botToken,
                request.body.message.chat.id,
                reply.output,
            )
        },
    )

    done()
}