import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { requestResultOutputSchema } from '../output-schemas';

export const assignAlertAction = createAction({
    auth: jsmOpsAuth,
    name: 'assign_alert',
    classification: 'WRITE',
    displayName: 'Assign Alert',
    description: 'Make a user the owner of an alert. Not available on the JSM Free plan.',
    audience: 'both',
    aiMetadata: {
        description:
            'Sets the owner of a JSM Operations alert to one Atlassian user, picked by account. Use Add Responder to Alert to notify more people without changing the owner. Needs an Atlassian account connection and a paid JSM plan (the Free plan rejects assignment). Safe to retry.',
        idempotent: true,
    },
    props: {
        alert: jsmOpsProps.alert(),
        identifierType: jsmOpsProps.identifierType(),
        accountId: jsmOpsProps.user({
            displayName: 'Assignee',
            description: 'The user who will own the alert. Type to search.',
        }),
    },
    outputSchema: requestResultOutputSchema,
    async run(context) {
        const accountId = context.propsValue.accountId?.trim() ?? '';
        if (accountId.length === 0) {
            throw new Error('Pick the user to assign the alert to.');
        }
        return jsmOps.runAccountAlertRequest({
            auth: context.auth,
            feature: 'Assign Alert',
            alert: context.propsValue.alert,
            identifierType: context.propsValue.identifierType === 'alias' ? 'alias' : 'id',
            method: HttpMethod.POST,
            suffix: 'assign',
            body: { accountId },
            verb: 'assign the alert',
        });
    },
});
