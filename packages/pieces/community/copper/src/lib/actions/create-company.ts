import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const createCompany = createAction({
    name: 'create_company',
    auth: copperAuth,
    displayName: 'Create Company',
    description: 'Adds a new company.',
    props: {
        name: Property.ShortText({
            displayName: 'Company Name',
            required: true,
        }),
        primary_contact_id: copperProps.primaryContactId,
        email_domain: Property.ShortText({
            displayName: "Email Domain",
            description: "The company's email domain (e.g., example.com).",
            required: false,
        }),
        details: Property.LongText({
            displayName: 'Details',
            description: 'Additional notes or description about the company.',
            required: false,
        }),
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
        const { name, phone_number, street, city, state, postal_code, country, ...otherProps } = context.propsValue;

        const body: Record<string, unknown> = {
            name: name,
            ...otherProps
        };

        if (phone_number) {
            body['phone_numbers'] = [{
                number: phone_number,
                category: 'work', // Defaulting to 'work' category
            }];
        }

        const address = { street, city, state, postal_code, country };
        if (Object.values(address).some(field => field !== undefined && field !== '')) {
            body['address'] = address;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.copper.com/developer_api/v1/companies',
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