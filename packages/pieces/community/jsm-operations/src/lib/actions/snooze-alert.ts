import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { requestResultOutputSchema } from '../output-schemas';

export const snoozeAlertAction = createAction({
    auth: jsmOpsAuth,
    name: 'snooze_alert',
    classification: 'WRITE',
    displayName: 'Snooze Alert',
    description: 'Pause notifications for an alert until a set time. Not on JSM Free.',
    audience: 'both',
    aiMetadata: {
        description:
            'Snoozes a JSM Operations alert until the given end time, pausing its notifications; the alert reopens after that. Needs an Atlassian account connection and a paid JSM plan (the Free plan rejects snoozing). Snoozing again to the same time has the same result, so it is safe to retry.',
        idempotent: true,
    },
    props: {
        alert: jsmOpsProps.alert(),
        identifierType: jsmOpsProps.identifierType(),
        endTime: Property.DateTime({
            displayName: 'Snooze Until',
            description: 'When notifications should start again. Must be in the future.',
            required: true,
        }),
    },
    outputSchema: requestResultOutputSchema,
    async run(context) {
        const endTime = new Date(context.propsValue.endTime);
        if (Number.isNaN(endTime.getTime())) {
            throw new Error('Snooze Until must be a valid date and time.');
        }
        if (endTime.getTime() <= Date.now()) {
            throw new Error('Snooze Until must be in the future.');
        }
        return jsmOps.runAccountAlertRequest({
            auth: context.auth,
            feature: 'Snooze Alert',
            alert: context.propsValue.alert,
            identifierType: context.propsValue.identifierType === 'alias' ? 'alias' : 'id',
            method: HttpMethod.POST,
            suffix: 'snooze',
            body: { endTime: endTime.toISOString() },
            verb: 'snooze the alert',
        });
    },
});
