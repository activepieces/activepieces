import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';
import { zendeskSellCommon } from '../common/props';

export const updateDeal = createAction({
    auth: zendeskSellAuth,
    name: 'update_deal',
    displayName: 'Update Deal',
    description: 'Update fields of an existing deal.', 
    props: {
        deal_id: zendeskSellCommon.deal(true), 
        
        name: Property.ShortText({
            displayName: 'Deal Name',
            required: false,
        }),
        contact_id: zendeskSellCommon.contact(false), 
        value: Property.Number({
            displayName: 'Value (Amount)',
            description: 'The monetary value of the deal (e.g., 1500).',
            required: false,
        }),
        currency: Property.ShortText({
            displayName: 'Currency',
            description: '3-character currency code (e.g., USD).',
            required: false,
        }),
        estimated_close_date: Property.ShortText({
            displayName: 'Estimated Close Date',
            description: 'The expected close date in YYYY-MM-DD format.',
            required: false,
        }),
        hot: Property.Checkbox({
            displayName: 'Hot Deal?',
            description: 'Check this box to mark the deal as "hot".',
            required: false,
        }),

        pipeline_id: zendeskSellCommon.pipeline(false),
        stage_id: zendeskSellCommon.stage(false), 
        owner_id: zendeskSellCommon.owner(), 
        source_id: zendeskSellCommon.leadSource(), 
        tags: zendeskSellCommon.tags('deal'), 

        custom_fields: Property.Json({
            displayName: 'Custom Fields',
            description: 'A key-value object for any custom fields.',
            required: false,
            defaultValue: {}
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        

        const { deal_id, pipeline_id, ...otherProps } = propsValue;

        const rawBody: Record<string, unknown> = {
            ...otherProps,
        };

        const cleanedBody = Object.entries(rawBody).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);


        if (Object.keys(cleanedBody).length === 0) {
            throw new Error("No fields were provided to update. Please fill at least one field.");
        }

        const response = await callZendeskApi(
            HttpMethod.PUT,
            `v2/deals/${deal_id}`, 
            auth,
            { data: cleanedBody } 
        );

        return response.body;
    },
});