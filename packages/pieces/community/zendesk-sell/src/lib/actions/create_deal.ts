import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';
import { zendeskSellCommon } from '../common/props';

export const createDeal = createAction({
    auth: zendeskSellAuth,
    name: 'create_deal',
    displayName: 'Create Deal',
    description: 'Create a new deal under an existing contact.',
    props: {
        name: Property.ShortText({
            displayName: 'Deal Name',
            required: true,
        }),
        contact_id: zendeskSellCommon.contact(true), 
        value: Property.ShortText({
            displayName: 'Value',
            description: 'The monetary value of the deal (e.g., 15000).',
            required: false,
        }),
        currency: Property.ShortText({
            displayName: 'Currency',
            description: '3-character currency code (e.g., USD).',
            required: false,
        }),
        pipeline_id: zendeskSellCommon.pipeline(false),
        stage_id: zendeskSellCommon.stage(false),
        owner_id: zendeskSellCommon.owner(), 
        source_id: zendeskSellCommon.leadSource(), 
        hot: Property.Checkbox({
            displayName: 'Hot Deal?',
            description: 'Check this box to mark the deal as "hot".',
            required: false,
        }),
        tags: zendeskSellCommon.tags('deal'), // Optional Tags
        custom_fields: Property.Json({
            displayName: 'Custom Fields',
            description: 'A key-value object for any custom fields.',
            required: false,
            defaultValue: {}
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { pipeline_id, ...otherProps } = propsValue;

        const rawBody: Record<string, unknown> = {
            ...otherProps,
        };


        const cleanedBody = Object.entries(rawBody).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);

        const response = await callZendeskApi(
            HttpMethod.POST,
            'v2/deals',
            auth,
            { data: cleanedBody } 
        );

        return response.body;
    },
});