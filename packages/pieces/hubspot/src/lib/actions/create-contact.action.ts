import { createAction, Property } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { hubSpotAuthentication } from "../common/props";

export const createHubspotContact = createAction({
    name: 'create_contact',
    displayName: "Create Contact",
    description: "Fails on duplicate email addresses",
    props: {
        authentication: hubSpotAuthentication,
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: 'First name of the new contact',
            required: true,
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            description: 'Last name of the new contact',
            required: true,
        }),
        zip: Property.ShortText({
            displayName: 'Zip Code',
            description: 'Zip code of the new contact',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Email of the new contact',
            required: false,
        })
    },
    sampleData: {},
    async run(context) {
        const configsWithoutAuthentication: Record<string, unknown> = { ...context.propsValue };
        delete configsWithoutAuthentication['authentication'];
        const body = {
            properties: Object.entries(configsWithoutAuthentication).map(f => {
                return {
                    property: f[0] as string,
                    value: f[1]
                }
            }),
        }
        const request: HttpRequest<{ properties: { property: string, value: any }[] }> = {
            method: HttpMethod.POST,
            url: 'https://api.hubapi.com/contacts/v1/contact/',
            body: body,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.propsValue.authentication.access_token,
            },
            queryParams: {},
        };
        const result = await httpClient.sendRequest(request);

        return {
            success: true,
            request_body: body,
            response_body: result.body,
        };
    },
});
