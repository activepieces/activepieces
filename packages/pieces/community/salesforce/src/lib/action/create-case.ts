import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { sobjectCreateResponseOutputSchema } from '../output-schemas';

export const createCase = createAction({
    auth: salesforceAuth,
    name: 'create_case',
    classification: 'WRITE',
    displayName: 'Create Case',
    description: 'Creates a case for a customer issue.',
    audience: 'both',
    aiMetadata: { description: 'Create a new support Case (customer issue/problem) with a required Subject and optional status, priority, origin, and links to an Account or Contact. Not idempotent — each call opens a separate Case, so guard against duplicate submissions.', idempotent: false },
    outputSchema: sobjectCreateResponseOutputSchema,
    propertyGroups: [
        { key: 'case', display: 'section', label: 'Case', icon: 'text', props: ['Subject', 'Description'] },
        { key: 'details', display: 'section', label: 'Details', icon: 'tag', props: ['Status', 'Priority', 'Origin'] },
        { key: 'related', display: 'section', label: 'Related To', icon: 'paperclip', props: ['AccountId', 'ContactId'] },
    ],
    props: {
        Subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
            placeholder: 'Cannot sign in to the portal',
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
            description: 'More fields as JSON, with Salesforce field API names as keys.',
            required: false,
            advanced: true,
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