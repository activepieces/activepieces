import { createAction, Property } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { addNoteOutputSchema } from '../output-schemas';

export const addNoteAction = createAction({
    auth: jsmOpsAuth,
    name: 'add_note',
    classification: 'WRITE',
    displayName: 'Add Note to Alert',
    description: 'Add a note to an alert.',
    audience: 'both',
    aiMetadata: {
        description:
            'Adds a text note to a JSM Operations or Opsgenie alert by ID or alias, for status updates or findings. Works with both connection types. Each call adds another note, so retries duplicate it.',
        idempotent: false,
    },
    props: {
        alert: jsmOpsProps.alert(),
        identifierType: jsmOpsProps.identifierType(),
        note: Property.LongText({
            displayName: 'Note',
            description: 'The note text. Up to 25,000 characters.',
            required: true,
        }),
        user: Property.ShortText({
            displayName: 'Added By',
            description: 'API key connections only: the name shown on the note.',
            required: false,
            advanced: true,
        }),
        source: Property.ShortText({
            displayName: 'Source',
            description: 'API key connections only: where the note came from.',
            required: false,
            advanced: true,
        }),
    },
    outputSchema: addNoteOutputSchema,
    async run(context) {
        const { alert, identifierType, note, user, source } = context.propsValue;
        return jsmOps.addNote({
            auth: context.auth,
            alert,
            identifierType: identifierType === 'alias' ? 'alias' : 'id',
            note,
            user,
            source,
        });
    },
});
