import {AuthenticationType} from "../../../common/authentication/core/authentication-type";
import {httpClient} from "../../../common/http/core/http-client";
import {HttpMethod} from "../../../common/http/core/http-method";
import {HttpRequest} from "../../../common/http/core/http-request";
import {createAction} from "../../../framework/action/action";
import {Property} from "../../../framework/property/prop.model";
import { hubspotCommons } from "../common";


export const createHubspotContact = createAction({
    name: 'create_contact',
    displayName: "Create Contact",
    description: "Creates a contact on hubspot",
    props: {
        authentication: hubspotCommons.authentication,
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: 'First name of the new contact',
            required: true,
            secret: false,
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            description: 'Last name of the new contact',
            required: true,
            secret: false,
        }),
        zip: Property.ShortText({
            displayName: 'Zip Code',
            description: 'Zip code of the new contact',
            required: false,
            secret: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Email of the new contact',
            required: false,
            secret: false,
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
            response_body: result.body,
        };
    },
});
