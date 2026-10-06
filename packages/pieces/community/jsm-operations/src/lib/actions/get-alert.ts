import { createAction } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { alertOutputSchema } from '../output-schemas';

export const getAlertAction = createAction({
    auth: jsmOpsAuth,
    name: 'get_alert',
    classification: 'READ',
    displayName: 'Get Alert',
    description: 'Get one alert by its ID or alias.',
    audience: 'both',
    aiMetadata: {
        description:
            'Reads a single JSM Operations alert by its alert ID or by its alias and returns its status, priority, owner, tags and timestamps. Use Find Alerts to search by criteria instead. Needs an Atlassian account connection. Safe to retry.',
        idempotent: true,
    },
    props: {
        alert: jsmOpsProps.alert(),
        identifierType: jsmOpsProps.identifierType(),
    },
    outputSchema: alertOutputSchema,
    async run(context) {
        const route = await jsmOps.requireAccountRoute({ auth: context.auth, feature: 'Get Alert' });
        const alert = await jsmOps.getAlert({
            route,
            alert: context.propsValue.alert,
            identifierType: context.propsValue.identifierType === 'alias' ? 'alias' : 'id',
        });
        return jsmOps.toAlertOutput(alert);
    },
});
