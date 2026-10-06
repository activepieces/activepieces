import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { RequestResult } from '../common/types';
import { updateAlertOutputSchema } from '../output-schemas';

export const updateAlertAction = createAction({
    auth: jsmOpsAuth,
    name: 'update_alert',
    classification: 'WRITE',
    displayName: 'Update Alert',
    description: 'Change the message, description or priority of an alert.',
    audience: 'both',
    aiMetadata: {
        description:
            'Updates the message, description and/or priority of an existing JSM Operations alert; only the fields you fill in are changed. Needs an Atlassian account connection. Setting the same values again gives the same result, so it is safe to retry.',
        idempotent: true,
    },
    props: {
        alert: jsmOpsProps.alert(),
        identifierType: jsmOpsProps.identifierType(),
        message: Property.ShortText({
            displayName: 'New Message',
            description: 'Leave empty to keep the current message. Up to 130 characters.',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'New Description',
            description: 'Leave empty to keep the current description.',
            required: false,
        }),
        priority: jsmOpsProps.priority({ required: false }),
    },
    outputSchema: updateAlertOutputSchema,
    async run(context) {
        const { message, description, priority } = context.propsValue;
        const changes = [
            { field: 'message', value: message?.trim() ?? '' },
            { field: 'description', value: description?.trim() ?? '' },
            { field: 'priority', value: priority ?? '' },
        ].filter((change) => change.value.length > 0);
        if (changes.length === 0) {
            throw new Error('Fill in at least one of New Message, New Description or Priority.');
        }
        const route = await jsmOps.requireAccountRoute({ auth: context.auth, feature: 'Update Alert' });
        const alertId = await jsmOps.resolveAlertId({
            route,
            alert: context.propsValue.alert,
            identifierType: context.propsValue.identifierType === 'alias' ? 'alias' : 'id',
        });
        const requests: (RequestResult & { field: string })[] = [];
        for (const change of changes) {
            const result = await jsmOps.runAsync({
                route,
                method: HttpMethod.PATCH,
                path: `/alerts/${encodeURIComponent(alertId)}/${change.field}`,
                body: { [change.field]: change.value },
                verb: `update the alert ${change.field}`,
            });
            requests.push({ field: change.field, ...result, alert_id: result.alert_id ?? alertId });
        }
        return {
            alert_id: alertId,
            updated_fields: changes.map((change) => change.field).join(', '),
            processed: requests.every((request) => request.processed),
            requests,
        };
    },
});
