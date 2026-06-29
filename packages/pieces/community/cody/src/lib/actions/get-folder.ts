import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';

export const getFolderAction = createAction({
    auth: codyAuth,
    name: 'get_folder',
    displayName: 'Get Folder',
    description: 'Retrieve a single Cody knowledge-base folder by its ID.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Retrieves the details of a single Cody knowledge-base folder by its ID. Use when you already have the folder ID; to search across folders use List Folders (which returns full folder objects). Resolve the folder ID via List Folders. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        folder_id: Property.ShortText({
            displayName: 'Folder ID',
            description: 'The ID of the folder to retrieve. Resolve via List Folders.',
            required: true,
        }),
    },
    async run(context) {
        const { folder_id } = context.propsValue;
        const apiKey = context.auth;

        return await codyClient.get(apiKey, `/folders/${folder_id}`);
    },
});
