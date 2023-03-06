import { Property, HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/framework";

export const pipedriveCommon = {
    authentication: Property.OAuth2({
        description: "",
        displayName: 'Authentication',
        authUrl: "https://oauth.pipedrive.com/oauth/authorize",
        tokenUrl: "https://oauth.pipedrive.com/oauth/token",
        required: true,
        scope: ["admin", "contacts:full", "users:read"]
    }),
    subscribeWebhook: async (object: string, action: string, webhookUrl: string, apiDomain: string, accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${apiDomain}/api/v1/webhooks`,
            body: {
                event_object: object,
                event_action: action,
                subscription_url: webhookUrl,
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
            queryParams: {},
        };

        const { body: webhook } = await httpClient.sendRequest<{ data: { id: string } }>(request);
        return webhook;
    },
    unsubscribeWebhook: async (webhookId: string, apiDomain: string, accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url: `${apiDomain}/api/v1/webhooks/${webhookId}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
        };
        return await httpClient.sendRequest(request);
    }
}
