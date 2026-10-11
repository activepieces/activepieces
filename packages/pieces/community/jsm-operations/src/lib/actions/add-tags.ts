import { createAction, Property } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { requestResultOutputSchema } from '../output-schemas';

export const addTagsAction = createAction({
    auth: jsmOpsAuth,
    name: 'add_tags',
    classification: 'WRITE',
    displayName: 'Add Tags to Alert',
    description: 'Add one or more tags to an alert.',
    audience: 'both',
    aiMetadata: {
        description:
            'Adds tags to a JSM Operations alert by ID or alias, keeping its existing tags. Use Remove Tags from Alert to take tags off. Needs an Atlassian account connection. Adding a tag that is already there has no effect, so it is safe to retry.',
        idempotent: true,
    },
    props: {
        alert: jsmOpsProps.alert(),
        identifierType: jsmOpsProps.identifierType(),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Tags to add to the alert.',
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
            operation: 'add',
        });
    },
});
