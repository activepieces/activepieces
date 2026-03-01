import { HttpMethod, httpClient, HttpRequest} from '@activepieces/pieces-common';

export const workableCommon = {
    subscribeWebhook: async (
        subdomain: string,
        accessToken: string,
        webhookUrl: string,
        event: string,
        args: Record<string, any> = {}
    ) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `https://${subdomain}.workable.com/spi/v3/subscriptions`,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
            },
            body: {
                target: webhookUrl,
                event,
                args,
            }
        };
        const response = await httpClient.sendRequest<{id: string}>(request);
        return response.body;
    },

    unsubscribeWebhook: async (
        subdomain: string,
        accessToken: string,
        subscriptionId: string
    ) => {
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url: `https://${subdomain}.workable.com/spi/v3/subscriptions/${subscriptionId}`,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json'
            }
        }

        return await httpClient.sendRequest(request);
    }

}