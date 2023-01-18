import { Property } from '../../../framework/property';
import { httpClient } from '../../../common/http/core/http-client';
import { HttpRequest } from '../../../common/http/core/http-request';
import { HttpMethod } from '../../../common/http/core/http-method';
import { AuthenticationType } from '../../../common/authentication/core/authentication-type';

export const stripeCommon = {
    baseUrl:  "https://api.stripe.com/v1",
    authentication: Property.OAuth2({
        displayName: "Authentication",
        required: true,
        authUrl: 'https://connect.stripe.com/oauth/authorize',
        tokenUrl: 'https://connect.stripe.com/oauth/token',
        scope: ['read_write'],
    }),
    subscribeWebhook: async (eventName: string, webhookUrl: string, apiKey: string) => {
        const request: HttpRequest<any> = {
            method: HttpMethod.POST,
            url: `${stripeCommon.baseUrl}/webhook_endpoints`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: {
                enabled_events: [
                eventName
                ],
                url: webhookUrl
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: apiKey,
            },
            queryParams: {},
        };

        let { body: webhook } = await httpClient.sendRequest<{ id: string }>(request);
        return webhook;
    },
    unsubscribeWebhook: async (webhookId: string, apiKey: string) => {
        const request: HttpRequest<never> = {
            method: HttpMethod.DELETE,
            url: `${stripeCommon.baseUrl}/webhook_endpoints/${webhookId}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: apiKey,
            },
        };
        return await httpClient.sendRequest(request);
    }
}
