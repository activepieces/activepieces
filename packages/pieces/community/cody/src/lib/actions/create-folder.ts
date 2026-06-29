import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';

export const createFolderAction = createAction({
    auth: codyAuth,
    name: 'create_folder',
    displayName: 'Create Folder',
    description: 'Create a Cody knowledge-base folder.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Creates a new knowledge-base folder, the container that documents live in. Use to set up the knowledge-base structure before ingesting documents; the returned folder ID is then passed to the document-create actions. Requires a name; creates a new folder each call, so it is not idempotent.',
        idempotent: false,
    },
    props: {
        name: Property.ShortText({
            displayName: 'Name',
            description: 'The name of the new folder.',
            required: true,
        }),
    },
    async run(context) {
        const { name } = context.propsValue;
        const apiKey = context.auth;

        return await codyClient.post(apiKey, `/folders`, { name });
    },
});
