import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi, zendeskSellCommon } from '../common';
import { ZendeskSellAuth } from '../common/auth';

export const updateDeal = createAction({
    auth: zendeskSellAuth,
    name: 'update_deal',
    displayName: 'Update Deal',
    description: 'Update deal fields (amount, stage, close date).',
    props: {
        deal_id: zendeskSellCommon.deal(true),
        pipeline_id: zendeskSellCommon.pipeline(false), 
        stage_id: zendeskSellCommon.stage(false),
        value: Property.Number({
            displayName: 'Value',
            description: 'The monetary value of the deal.',
            required: false,
        }),
        estimated_close_date: Property.ShortText({
            displayName: 'Estimated Close Date',
            description: 'The projected date for closing the deal, in YYYY-MM-DD format.',
            required: false,
        }),
        owner_id: zendeskSellCommon.owner(),
        name: Property.ShortText({
            displayName: 'Deal Name',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { deal_id, ...fieldsToUpdate } = propsValue;

        const cleanedBody = Object.entries(fieldsToUpdate).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);
        
        if (Object.keys(cleanedBody).length === 0) {
            return { success: true, message: "No fields provided to update." };
        }

        const response = await callZendeskApi(
            HttpMethod.PUT,
            `v2/deals/${deal_id}`,
            auth as ZendeskSellAuth,
            { data: cleanedBody }
        );

        return response.body;
    },
});