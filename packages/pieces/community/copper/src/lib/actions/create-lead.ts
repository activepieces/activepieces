import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const createLead = createAction({
    name: 'create_lead',
    auth: copperAuth,
    displayName: 'Create Lead',
    description: 'Adds a new lead.',
    props: {
        name: Property.ShortText({
            displayName: 'Lead Name',
            description: "The name of the lead (e.g., a person's name or company name).",
            required: true,
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: "The lead's job title.",
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: "The lead's primary email address.",
            required: false,
        }),
        customer_source_id: copperProps.customerSourceId,
        phone_number: Property.ShortText({
            displayName: 'Phone Number',
            required: false,
        }),
        street: Property.ShortText({ displayName: 'Street', required: false }),
        city: Property.ShortText({ displayName: 'City', required: false }),
        state: Property.ShortText({ displayName: 'State', required: false }),
        postal_code: Property.ShortText({ displayName: 'Postal Code', required: false }),
        country: Property.ShortText({ displayName: 'Country', required: false }),
    },
    async run(context) {
        const { name, email, street, city, state, postal_code, country, ...otherProps } = context.propsValue;

        const body: Record<string, unknown> = {
            name: name,
            ...otherProps
        };

        if (email) {
            body['email'] = {
                email: email,
                category: 'work', // Defaulting to 'work' category
            };
        }

        const address = { street, city, state, postal_code, country };
        if (Object.values(address).some(field => field !== undefined && field !== '')) {
            body['address'] = address;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.copper.com/developer_api/v1/leads',
            headers: {
                'X-PW-AccessToken': context.auth.token,
                'X-PW-UserEmail': context.auth.email,
                'X-PW-Application': 'developer_api',
                'Content-Type': 'application/json',
            },
            body: body
        });

        return response.body;
    }
});