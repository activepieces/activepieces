import { createAction, Property } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { requestResultOutputSchema } from '../output-schemas';

export const removeTagsAction = createAction({
    auth: jsmOpsAuth,
    name: 'remove_tags',
    classification: 'WRITE',
    displayName: 'Remove Tags from Alert',
    description: 'Remove one or more tags from an alert.',
    audience: 'both',
    aiMetadata: {
        description:
            'Removes the listed tags from a JSM Operations alert by ID or alias; the alert itself is kept. Use Add Tags to Alert to add them back. Needs an Atlassian account connection. Safe to retry.',
        idempotent: true,
    },
    props: {
        alert: jsmOpsProps.alert(),
        identifierType: jsmOpsProps.identifierType(),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Tags to remove from the alert.',
            required: true,
        }),
    },
    outputSchema: requestResultOutputSchema,
    async run(context) {
        return jsmOps.changeTags({
            auth: context.auth,
            alert: context.propsValue.alert,
            identifierType: context.propsValue.identifierType === 'alias' ? 'alias' : 'id',
            tags: context.propsValue.tags,
            operation: 'remove',
        });
    },
});
