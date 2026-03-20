import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';
import { zendeskSellCommon } from '../common/props';

export const findLead = createAction({
    auth: zendeskSellAuth,
    name: 'find_lead',
    displayName: 'Find Lead',
    description: 'Find a lead by one or more fields.',
    props: {
        first_name: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            required: false,
        }),
        organization_name: Property.ShortText({
            displayName: 'Organization Name',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            required: false,
        }),
        status: Property.ShortText({
            displayName: 'Status',
            description: 'Filter by lead status (e.g., "New").',
            required: false,
        }),
        source_id: zendeskSellCommon.leadSource(),
        owner_id: zendeskSellCommon.owner(), 
    },
    async run(context) {
        const { auth, propsValue } = context;


        const params: Record<string, string> = {};
        

        for (const [key, value] of Object.entries(propsValue)) {
            if (key !== 'auth' && value !== undefined && value !== null && value !== '') {
                params[key] = value.toString();
            }
        }


        if (Object.keys(params).length === 0) {
            throw new Error('Please provide at least one search field (Email, Name, Status, etc.).');
        }
        
        const response = await callZendeskApi(
            HttpMethod.GET,
            'v2/leads',
            auth,
            undefined, 
            params     
        );


        const items = (response.body as { items: Record<string, unknown>[] })?.items;

        if (items && items.length > 0) {
            return items[0]; 
        }


        return { data: null };
    },
});