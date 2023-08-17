import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { getServerUrl } from '../../helper/public-ip-utils'

export const telegramIntegration = {
    subscribeWebhook: async (botToken: string, botId: string, projectId: string) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `https://api.telegram.org/bot${botToken}/setWebhook`,
            body: {
                url: `${await getServerUrl()}v1/chatbots/${botId}/telegram/webhook?projectId=${projectId}`,
            },
        }

        await httpClient.sendRequest(request)
    },
    unsubscribeWebhook: async (botToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://api.telegram.org/bot${botToken}/deleteWebhook`,
        }
        return await httpClient.sendRequest(request)
    },
    sendMessage: async (botToken: string, chatId: number, message: string) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `https://api.telegram.org/bot${botToken}/sendMessage`,
            body: {
                chat_id: chatId,
                text: message,
            },
        }
        return await httpClient.sendRequest(request)
    },
}