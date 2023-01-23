import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { Property } from "../../../framework/property";

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
        const request: HttpRequest<any> = {
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

        let { body: webhook } = await httpClient.sendRequest<{ data: { id: string } }>(request);
        return webhook;
    },
    unsubscribeWebhook: async (webhookId: string, apiDomain: string, accessToken: string) => {
        const request: HttpRequest<never> = {
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