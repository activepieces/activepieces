import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { requestResultOutputSchema } from '../output-schemas';

export const escalateAlertAction = createAction({
    auth: jsmOpsAuth,
    name: 'escalate_alert',
    classification: 'WRITE',
    displayName: 'Escalate Alert',
    description: 'Escalate an alert to the next level of an escalation policy.',
    audience: 'both',
    aiMetadata: {
        description:
            'Escalates a JSM Operations alert through the chosen escalation policy, notifying its next recipients. Use Add Responder to Alert to notify one specific team or user. Needs an Atlassian account connection. Each call can notify further recipients, so retries are not safe.',
        idempotent: false,
    },
    props: {
        alert: jsmOpsProps.alert(),
        identifierType: jsmOpsProps.identifierType(),
        escalationId: jsmOpsProps.escalation({
            displayName: 'Escalation',
            description: 'The escalation policy to use, listed with its team.',
        }),
    },
    outputSchema: requestResultOutputSchema,
    async run(context) {
        const escalationId = context.propsValue.escalationId?.trim() ?? '';
        if (escalationId.length === 0) {
            throw new Error('Pick the escalation to use.');
        }
        return jsmOps.runAccountAlertRequest({
            auth: context.auth,
            feature: 'Escalate Alert',
            alert: context.propsValue.alert,
            identifierType: context.propsValue.identifierType === 'alias' ? 'alias' : 'id',
            method: HttpMethod.POST,
            suffix: 'escalate',
            body: { escalationId },
            verb: 'escalate the alert',
        });
    },
});
