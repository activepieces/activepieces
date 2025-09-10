import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";

export const createPerson = createAction({
    name: 'create_person',
    auth: copperAuth,
    displayName: 'Create Person',
    description: 'Adds a new person/contact.',
    props: {
        name: Property.ShortText({
            displayName: 'Full Name',
            description: "The person's full name.",
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: "The person's primary email address.",
            required: true,
        }),
        email_category: Property.StaticDropdown({
            displayName: 'Email Category',
            required: false,
            options: {
                options: [
                    { label: 'Work', value: 'work' },
                    { label: 'Personal', value: 'personal' },
                    { label: 'Other', value: 'other' }
                ]
            },
            defaultValue: 'work'
        }),
        phone_number: Property.ShortText({
            displayName: 'Phone Number',
            required: false,
        }),
        phone_category: Property.StaticDropdown({
            displayName: 'Phone Category',
            required: false,
            options: {
                options: [
                    { label: 'Mobile', value: 'mobile' },
                    { label: 'Work', value: 'work' },
                    { label: 'Home', value: 'home' },
                    { label: 'Other', value: 'other' }
                ]
            },
            defaultValue: 'mobile'
        }),
        street: Property.ShortText({ displayName: 'Street', required: false }),
        city: Property.ShortText({ displayName: 'City', required: false }),
        state: Property.ShortText({ displayName: 'State', required: false }),
        postal_code: Property.ShortText({ displayName: 'Postal Code', required: false }),
        country: Property.ShortText({ displayName: 'Country', required: false }),
    },
    async run(context) {
        const { name, email, email_category, phone_number, phone_category, street, city, state, postal_code, country } = context.propsValue;

        const body: Record<string, unknown> = {
            name: name,
            emails: [{
                email: email,
                category: email_category,
            }],
        };

        if (phone_number) {
            body['phone_numbers'] = [{
                number: phone_number,
                category: phone_category,
            }];
        }

        // 👇 RECONSTRUCT THE ADDRESS OBJECT MANUALLY
        const address = { street, city, state, postal_code, country };
        // Only add the address object to the body if at least one of its fields is filled out
        if (Object.values(address).some(field => field !== undefined && field !== '')) {
            body['address'] = address;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.copper.com/developer_api/v1/people',
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