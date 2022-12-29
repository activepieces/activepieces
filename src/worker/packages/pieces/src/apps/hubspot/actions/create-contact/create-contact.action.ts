import {AuthenticationType} from "../../../../common/authentication/core/authentication-type";
import {httpClient} from "../../../../common/http/core/http-client";
import {HttpMethod} from "../../../../common/http/core/http-method";
import {HttpRequest} from "../../../../common/http/core/http-request";
import {createAction} from "../../../../framework/action/action";
import {Context} from "../../../../framework/context";
import {Property} from "../../../../framework/property/prop.model";


export const createHubspotContact = createAction({
    name: 'create_contact',
    displayName: "Create Contact",
    description: "Create Contact",
    props: {
        authentication: Property.OAuth2({
            description: "",
            displayName: 'Authentication',
            authUrl: "https://app.hubspot.com/oauth/authorize",
            tokenUrl: "https://api.hubapi.com/oauth/v1/token",
            required: true,
            scope: ["crm.objects.contacts.write"]
        }),
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
    async run(context) {
        const configsWithoutAuthentication = {...context.propsValue};
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
                token: context.propsValue.authentication!.access_token,
            },
            queryParams: {},
        };
        const result = await httpClient.sendRequest(request);

        return {
            success: true,
            request_body: body,
            response_body: result
        };
    },
});
