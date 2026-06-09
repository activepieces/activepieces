import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const createCase = createAction({
    auth: salesforceAuth,
    name: 'create_case',
    displayName: 'Create Case',
    description: 'Creates a Case, which represents a customer issue or problem.',
    props: {
        Subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
        }),
        Description: Property.LongText({
            displayName: 'Description',
            required: false,
        }),
        Status: salesforcesCommon.caseStatus,
        Priority: salesforcesCommon.casePriority,
        Origin: salesforcesCommon.caseOrigin,
        AccountId: salesforcesCommon.account,
        ContactId: salesforcesCommon.optionalContact,
        other_fields: Property.Json({
            displayName: 'Other Fields',
            description: 'Enter additional fields as a JSON object.',
            required: false
        })
    },
    async run(context) {
        const {
            Subject,
            Description,
            Status,
            Priority,
            Origin,
            AccountId,
            ContactId,
            other_fields
        } = context.propsValue;

        const rawBody = {
            Subject,
            Description,
            Status,
            Priority,
            Origin,
            AccountId,
            ContactId,
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
            '/services/data/v56.0/sobjects/Case',
            cleanedBody
        );

        return response.body;
    },
});