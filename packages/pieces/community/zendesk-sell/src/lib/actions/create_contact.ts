import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';
import { zendeskSellCommon } from '../common/props'; 

export const createContact = createAction({
    auth: zendeskSellAuth,
    name: 'create_contact',
    displayName: 'Create Contact',
    description: 'Create a new contact.',
    props: {
        is_organization: Property.Checkbox({
            displayName: 'Is Organization',
            description: 'Check this box if the contact is an organization.',
            required: true,
            defaultValue: false,
        }),
        name: Property.ShortText({
            displayName: 'Organization Name',
            description: 'The name of the organization. Required if "Is Organization" is checked.',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: 'The last name of the individual. Required if "Is Organization" is not checked.',
            required: false,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: "The contact's primary email address.",
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            description: "The contact's phone number.",
            required: false,
        }),
        mobile: Property.ShortText({
            displayName: 'Mobile Phone',
            description: "The contact's mobile phone number.",
            required: false,
        }),
        tags: zendeskSellCommon.tags('contact'),
        address: Property.Json({
            displayName: 'Address',
            description: 'An object containing address details (e.g., {"line1": "2726 Smith Street", "city": "Hyannis", "country": "US"}).',
            required: false,
            defaultValue: {
                "line1": "",
                "city": "",
                "postal_code": "",
                "state": "",
                "country": ""
            }
        }),
        custom_fields: Property.Json({
            displayName: 'Custom Fields',
            description: 'A key-value object for any custom fields (e.g., {"referral_website": "http://www.example.com"}).',
            required: false,
            defaultValue: {}
        }),
        other_fields: Property.Json({
            displayName: 'Other Fields',
            description: 'Enter additional fields as a JSON object (e.g., {"title": "CEO", "website": "http://example.com"}).',
            required: false,
            defaultValue: {}
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { is_organization, name, last_name, other_fields, ...otherProps } = propsValue;

       
        if (is_organization && !name) {
            throw new Error('Organization Name is required when "Is Organization" is checked.');
        }
        if (!is_organization && !last_name) {
            throw new Error('Last Name is required for an individual contact.');
        }

        const rawBody: Record<string, unknown> = {
            is_organization,
            ...otherProps,
            ...(other_fields || {}),
        };

        if (is_organization) {
            rawBody['name'] = name;
        } else {
            rawBody['last_name'] = last_name;
        }

        
        const cleanedBody = Object.entries(rawBody).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);

        const response = await callZendeskApi(
            HttpMethod.POST,
            'v2/contacts',
            auth, 
            { data: cleanedBody } 
        );

        return response.body;
    },
});