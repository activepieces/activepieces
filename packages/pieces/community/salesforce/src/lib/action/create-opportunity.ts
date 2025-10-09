import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const createOpportunity = createAction({
    auth: salesforceAuth,
    name: 'create_opportunity',
    displayName: 'Create Opportunity',
    description: 'Creates a new opportunity.',
    props: {
        Name: Property.ShortText({
            displayName: 'Name',
            required: true,
        }),
        CloseDate: Property.ShortText({
            displayName: 'Close Date',
            description: 'The expected close date in YYYY-MM-DD format.',
            required: true,
        }),
        StageName: salesforcesCommon.opportunityStage,
        AccountId: salesforcesCommon.account,
        Amount: Property.Number({
            displayName: 'Amount',
            required: false,
        }),
        other_fields: Property.Json({
            displayName: 'Other Fields',
            description: 'Enter additional fields as a JSON object.',
            required: false
        })
    },
    async run(context) {
        const {
            Name,
            CloseDate,
            StageName,
            AccountId,
            Amount,
            other_fields
        } = context.propsValue;


        const rawBody = {
            Name,
            CloseDate,
            StageName,
            AccountId,
            Amount,
            ...(other_fields || {}), 
        };

        const cleanedBody = Object.entries(rawBody).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);

        const response = await callSalesforceApi(
            HttpMethod.POST,
            context.auth,
            '/services/data/v56.0/sobjects/Opportunity',
            cleanedBody
        );

        return response.body;
    },
});