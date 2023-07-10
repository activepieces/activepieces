import { HttpMethod, HttpRequest, httpClient } from "@activepieces/pieces-common";

export const telegramCommons = {
    getApiUrl: (botToken: string, methodName: string) => {
        return `https://api.telegram.org/bot${botToken}/${methodName}`;
    },
    subscribeWebhook: async (botToken: string, webhookUrl: string) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `https://api.telegram.org/bot${botToken}/setWebhook`,
            body: {
                url: webhookUrl
            }
        };

        await httpClient.sendRequest(request);
    },
    unsubscribeWebhook: async (botToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://api.telegram.org/bot${botToken}/deleteWebhook`,
        };
        return await httpClient.sendRequest(request);
    }
}
