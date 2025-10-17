import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi, zendeskSellCommon } from '../common';
import { ZendeskSellAuth } from '../common/auth';

export const createLead = createAction({
    auth: zendeskSellAuth,
    name: 'create_lead',
    displayName: 'Create Lead',
    description: 'Create a new lead record.',
    props: {
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: 'Required if Organization Name is empty.',
            required: false,
        }),
        organization_name: Property.ShortText({
            displayName: 'Organization Name',
            description: 'Required if Last Name is empty.',
            required: false,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        status: Property.ShortText({
            displayName: 'Status',
            description: 'The status of the lead (e.g., "New", "Working").',
            required: false,
        }),
        source_id: zendeskSellCommon.leadSource(),
        email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            required: false,
        }),
        tags: zendeskSellCommon.tags('lead'),
        address: Property.Json({
            displayName: 'Address',
            description: 'An object containing address details like line1, city, postal_code, etc.',
            required: false,
        }),
        custom_fields: Property.Json({
            displayName: 'Custom Fields',
            description: 'A key-value object for any custom fields.',
            required: false,
        }),
        other_fields: Property.Json({
            displayName: 'Other Fields',
            description: 'Enter additional fields as a JSON object (e.g., {"description": "Interested in new product"}).',
            required: false
        })
    },
    async run(context) {
        const { auth, propsValue } = context;

        if (!propsValue.last_name && !propsValue.organization_name) {
            throw new Error('Either Last Name or Organization Name must be provided.');
        }
        
        const rawBody = {
            ...propsValue,
            ...(propsValue.other_fields || {}),
        };
        delete rawBody.other_fields;

        const cleanedBody = Object.entries(rawBody).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);
        
        const response = await callZendeskApi(
            HttpMethod.POST,
            'v2/leads',
            auth as ZendeskSellAuth,
            { data: cleanedBody }
        );

        return response.body;
    },
});