import { createAction, Property } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { alertActionOutputSchema } from '../output-schemas';

export const closeAlertAction = createAction({
    auth: jsmOpsAuth,
    name: 'close_alert',
    classification: 'DESTRUCTIVE',
    displayName: 'Close Alert',
    description: 'Close an alert once the problem is resolved.',
    audience: 'both',
    aiMetadata: {
        description:
            'Closes a JSM Operations or Opsgenie alert by ID or alias, optionally adding a note, and waits briefly for the result. Works with both connection types. A closed alert cannot be reopened; closing an already closed alert has no further effect, so it is safe to retry. If the optional note cannot be added, the alert is still closed and note_added is false with the reason in note_error; retrying would add the note again.',
        idempotent: true,
    },
    props: {
        alert: jsmOpsProps.alert(),
        identifierType: jsmOpsProps.identifierType(),
        note: Property.LongText({
            displayName: 'Note',
            description: 'Optional note to add to the alert at the same time.',
            required: false,
        }),
        user: Property.ShortText({
            displayName: 'Done By',
            description: 'API key connections only: the name shown for this change.',
            required: false,
            advanced: true,
        }),
        source: Property.ShortText({
            displayName: 'Source',
            description: 'API key connections only: where the change came from.',
            required: false,
            advanced: true,
        }),
    },
    outputSchema: alertActionOutputSchema,
    async run(context) {
        const { alert, identifierType, note, user, source } = context.propsValue;
        return jsmOps.sendAlertAction({
            auth: context.auth,
            alert,
            identifierType: identifierType === 'alias' ? 'alias' : 'id',
            action: 'close',
            note,
            user,
            source,
        });
    },
});
