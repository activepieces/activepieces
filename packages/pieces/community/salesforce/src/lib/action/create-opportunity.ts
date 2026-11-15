import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { sobjectCreateResponseOutputSchema } from '../output-schemas';

export const createOpportunity = createAction({
    auth: salesforceAuth,
    name: 'create_opportunity',
    classification: 'WRITE',
    displayName: 'Create Opportunity',
    description: 'Creates an opportunity.',
    audience: 'human',
    aiMetadata: { description: 'Create a new sales Opportunity; Name, Close Date (YYYY-MM-DD), and Stage are required, with an optional Account link and Amount. Not idempotent — each call creates another Opportunity.', idempotent: false },
    outputSchema: sobjectCreateResponseOutputSchema,
    propertyGroups: [
        { key: 'opportunity', display: 'section', label: 'Opportunity', icon: 'tag', props: ['Name', 'AccountId'] },
        { key: 'deal', display: 'section', label: 'Deal', icon: 'calendar', props: ['StageName', 'CloseDate', 'Amount'] },
    ],
    props: {
        Name: Property.ShortText({
            displayName: 'Name',
            required: true,
            placeholder: 'Acme renewal 2027',
        }),
        CloseDate: Property.ShortText({
            displayName: 'Close Date',
            description: 'The date the deal should close, as YYYY-MM-DD.',
            required: true,
            placeholder: '2026-12-31',
            width: 'half',
        }),
        StageName: salesforcesCommon.opportunityStage,
        AccountId: salesforcesCommon.account,
        Amount: Property.Number({
            displayName: 'Amount',
            description: "In your org's currency.",
            required: false,
            width: 'half',
        }),
        other_fields: Property.Json({
            displayName: 'Other Fields',
            description: 'More fields as JSON, with Salesforce field API names as keys.',
            required: false,
            advanced: true,
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