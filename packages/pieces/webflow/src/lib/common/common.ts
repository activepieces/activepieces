import { Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/pieces-common";

export const sitesDropdown = Property.Dropdown<string>({
    displayName: 'Site',
    description: 'Site Name',
    required: true,
    refreshers: ['authentication'],
    async options(propsValue) {
        const auth = propsValue['authentication'] as OAuth2PropertyValue;

        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect Webflow account',
                options: [],
            };
        }

        const accessToken = auth.access_token;

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: 'https://api.webflow.com/sites',
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
        };

        const response = await httpClient.sendRequest<{ _id: string, name: string }[]>(request);
        const options = response.body.map(item => ({
            label: item.name,
            value: item._id,
        }));

        return {
            disabled: false,
            placeholder: 'Select Site',
            options,
        };
    },
});

export const webflowCommon = {
        baseUrl: "https://api.webflow.com/",
        authentication: Property.OAuth2({
        description: "",
        displayName: 'Authentication',
        authUrl: "https://webflow.com/oauth/authorize",
        tokenUrl: "https://api.webflow.com/oauth/access_token",
        required: true,
        scope: ['webhooks:write', 'forms:read'],
    }),
    subscribeWebhook: async (siteId: string, tag: string, webhookUrl: string, accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `https://api.webflow.com/sites/${siteId}/webhooks`,
            headers: {
                "Content-Type": "application/json"
            },
            body: {
                triggerType: tag,
                url: webhookUrl
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
            queryParams: {},
        };
       
       const res = await httpClient.sendRequest(request);
       return res;
    },
    unsubscribeWebhook: async (siteId: string, webhookId: string, accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url: `https://api.webflow.com/sites/${siteId}/webhooks/${webhookId}`,

            headers: {
                "Content-Type": "application/json"
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
        };
        return await httpClient.sendRequest(request);
    }
}

