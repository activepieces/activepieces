import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common';
import { ZendeskSellAuth } from '../common/auth';

export const findLead = createAction({
    auth: zendeskSellAuth,
    name: 'find_lead',
    displayName: 'Find Lead',
    description: 'Find a lead by one or more fields.',
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Find a lead by their email address.',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: 'Find a lead by their last name.',
            required: false,
        }),
        organization_name: Property.ShortText({
            displayName: 'Organization Name',
            description: "Find a lead by their organization's name.",
            required: false,
        }),
        fail_on_not_found: Property.Checkbox({
            displayName: 'Fail if Not Found',
            description: 'If checked, the step will fail if no lead is found.',
            required: false,
            defaultValue: false,
        })
    },
    async run(context) {
        const { auth, propsValue } = context;

        const params = new URLSearchParams();
        if (propsValue.email) params.append('email', propsValue.email);
        if (propsValue.last_name) params.append('last_name', propsValue.last_name);
        if (propsValue.organization_name) params.append('organization_name', propsValue.organization_name);

        if (params.toString().length === 0) {
            throw new Error("At least one search field (Email, Last Name, or Organization Name) must be provided.");
        }

        const response = await callZendeskApi<{ items: { data: unknown }[] }>(
            HttpMethod.GET, 
            `v2/leads?${params.toString()}`, 
            auth as ZendeskSellAuth
        );
        
        let leadData = null;
        if (response.body.items.length > 0) {
            leadData = response.body.items[0].data;
        }

        if (!leadData && propsValue.fail_on_not_found) {
            throw new Error(`Lead not found for the provided criteria.`);
        }

        return leadData;
    },
});