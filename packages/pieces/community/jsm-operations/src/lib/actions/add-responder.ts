import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { requestResultOutputSchema } from '../output-schemas';

export const addResponderAction = createAction({
    auth: jsmOpsAuth,
    name: 'add_responder',
    classification: 'WRITE',
    displayName: 'Add Responder to Alert',
    description: 'Add a team, user, schedule or escalation as a responder.',
    audience: 'both',
    aiMetadata: {
        description:
            'Adds one responder (team, user, schedule or escalation) to a JSM Operations alert so they are notified. Use Assign Alert to change the owner instead. Needs an Atlassian account connection. Adding an existing responder has no further effect, so it is safe to retry.',
        idempotent: true,
    },
    props: {
        alert: jsmOpsProps.alert(),
        identifierType: jsmOpsProps.identifierType(),
        responderType: jsmOpsProps.responderType(),
        responder: jsmOpsProps.responder(),
    },
    outputSchema: requestResultOutputSchema,
    async run(context) {
        const { responderType, responder } = context.propsValue;
        const id = responder?.trim() ?? '';
        if (id.length === 0) {
            throw new Error('Pick the responder to add.');
        }
        return jsmOps.runAccountAlertRequest({
            auth: context.auth,
            feature: 'Add Responder to Alert',
            alert: context.propsValue.alert,
            identifierType: context.propsValue.identifierType === 'alias' ? 'alias' : 'id',
            method: HttpMethod.POST,
            suffix: 'responders',
            body: { id, type: responderType },
            verb: 'add the responder',
        });
    },
});
