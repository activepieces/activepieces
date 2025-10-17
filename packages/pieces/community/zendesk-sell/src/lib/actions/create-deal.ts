import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi, zendeskSellCommon } from '../common';
import { ZendeskSellAuth } from '../common/auth';

export const createDeal = createAction({
    auth: zendeskSellAuth,
    name: 'create_deal',
    displayName: 'Create Deal',
    description: 'Create a new deal for a contact.',
    props: {
        name: Property.ShortText({
            displayName: 'Deal Name',
            required: true,
        }),
        contact_id: zendeskSellCommon.contact(true),
        value: Property.Number({
            displayName: 'Value',
            description: 'The monetary value of the deal.',
            required: false,
        }),
        currency: Property.ShortText({
            displayName: 'Currency',
            description: 'The currency of the deal\'s value (e.g., "USD").',
            required: false,
        }),
        pipeline_id: zendeskSellCommon.pipeline(),
        stage_id: zendeskSellCommon.stage(),
        owner_id: zendeskSellCommon.owner(),
        hot: Property.Checkbox({
            displayName: 'Hot Deal',
            description: 'Mark this deal as hot.',
            required: false,
        }),
        tags: zendeskSellCommon.tags('deal'),
        custom_fields: Property.Json({
            displayName: 'Custom Fields',
            description: 'A key-value object for any custom fields.',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;

        const cleanedBody = Object.entries(propsValue).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);
        
        const response = await callZendeskApi(
            HttpMethod.POST,
            'v2/deals',
            auth as ZendeskSellAuth,
            { data: cleanedBody } // API requires the payload to be wrapped in a 'data' object
        );

        return response.body;
    },
});