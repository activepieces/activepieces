import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';
import { zendeskSellCommon } from '../common/props';

export const createLead = createAction({
    auth: zendeskSellAuth,
    name: 'create_lead',
    displayName: 'Create Lead',
    description: 'Create a new lead record.',
    props: {
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: "The lead's last name. Required if Organization Name is empty.",
            required: false,
        }),
        organization_name: Property.ShortText({
            displayName: 'Organization Name',
            description: "The lead's organization name. Required if Last Name is empty.",
            required: false,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        owner_id: zendeskSellCommon.owner(), 
        source_id: zendeskSellCommon.leadSource(), 
        status: Property.ShortText({
            displayName: 'Status',
            description: 'The current status of the lead (e.g., "New").',
            required: false,
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: "The lead's job title.",
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: "The lead's email address.",
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            description: "The lead's phone number.",
            required: false,
        }),
        mobile: Property.ShortText({
            displayName: 'Mobile Phone',
            description: "The lead's mobile phone number.",
            required: false,
        }),
        tags: zendeskSellCommon.tags('lead'), 
        address: Property.Json({
            displayName: 'Address',
            description: 'An object containing address details (e.g., {"line1": "123 Main St", "city": "Anytown"}).',
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
            description: 'A key-value object for any custom fields (e.g., {"known_via": "tom"}).',
            required: false,
            defaultValue: {}
        }),
        other_fields: Property.Json({
            displayName: 'Other Fields',
            description: 'Enter additional fields as a JSON object (e.g., {"description": "I know him via Tom", "website": "http://example.com"}).',
            required: false,
            defaultValue: {}
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { last_name, organization_name, other_fields, ...otherProps } = propsValue;


        if (!last_name && !organization_name) {
            throw new Error('Either Last Name or Organization Name is required to create a lead.');
        }

        const rawBody: Record<string, unknown> = {
            last_name,
            organization_name,
            ...otherProps,
            ...(other_fields || {}),
        };


        const cleanedBody = Object.entries(rawBody).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);

        const response = await callZendeskApi(
            HttpMethod.POST,
            'v2/leads',
            auth,
            { data: cleanedBody }
        );

        return response.body;
    },
});