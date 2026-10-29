import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { requestResultOutputSchema } from '../output-schemas';

export const unacknowledgeAlertAction = createAction({
    auth: jsmOpsAuth,
    name: 'unacknowledge_alert',
    classification: 'WRITE',
    displayName: 'Unacknowledge Alert',
    description: 'Put an acknowledged alert back to open.',
    audience: 'both',
    aiMetadata: {
        description:
            'Reverts an acknowledged JSM Operations alert to unacknowledged so notifications resume. Use Acknowledge Alert for the opposite. Needs an Atlassian account connection. Safe to retry.',
        idempotent: true,
    },
    props: {
        alert: jsmOpsProps.alert(),
        identifierType: jsmOpsProps.identifierType(),
    },
    outputSchema: requestResultOutputSchema,
    async run(context) {
        return jsmOps.runAccountAlertRequest({
            auth: context.auth,
            feature: 'Unacknowledge Alert',
            alert: context.propsValue.alert,
            identifierType: context.propsValue.identifierType === 'alias' ? 'alias' : 'id',
            method: HttpMethod.POST,
            suffix: 'unacknowledge',
            verb: 'unacknowledge the alert',
        });
    },
});
