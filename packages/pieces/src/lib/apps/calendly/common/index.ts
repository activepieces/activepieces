import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { Property } from "../../../framework/property"

interface CalendlyUser {
    /**User uri */
    uri: string;
    email: string;
    name: string;
    /**Organization uri */
    current_organization: string;

}
export interface CalendlyWebhookInformation {
    webhookId: string;
}

export const calendlyCommon = {
    baseUrl: 'https://api.calendly.com',
    scope: Property.Dropdown({
        displayName: 'Scope',
        required: true,
        refreshers: ["authentication"],
        options: async () => {
            return {
                options: [{ value: "user", label: "User" }, { value: "organization", label: "Organization" }],
                disabled: false,
            }
        },

    }),
    authentication: Property.SecretText({
        displayName: "Personal Token",
        required: true,
        description: "Get it from https://calendly.com/integrations/api_webhooks"
    }),
    getUser: async (personalToken: string) => {
        const request: HttpRequest<never> = {
            method: HttpMethod.GET,
            url: `${calendlyCommon.baseUrl}/users/me`,
            headers: {
                Authorization: calendlyCommon.authorizationHeader(personalToken),
            },
        };
        const response = await httpClient.sendRequest<{ resource: CalendlyUser }>(request);
        return response.body.resource;
    },
    authorizationHeader: (personalToken: string) => `Bearer ${personalToken}`,
    UuidFromUri: (uri: string) => uri.split('/').pop()

}

