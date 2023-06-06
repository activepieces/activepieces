import { HttpMethod, HttpRequest, httpClient } from "@activepieces/pieces-common";
import { Property } from "@activepieces/pieces-framework";

const markdownDescription = `
Refer to the [Telegram piece documentation](https://activepieces.com/docs/pieces/apps/telegram) for more information on how to obtain the bot token.
`;

export const telegramCommons = {
    bot_token: Property.SecretText({
        displayName: "Bot Token",
        description: markdownDescription,
        required: true,
    }),
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
