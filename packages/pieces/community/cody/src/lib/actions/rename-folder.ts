import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';

export const renameFolderAction = createAction({
    auth: codyAuth,
    name: 'rename_folder',
    displayName: 'Rename Folder',
    description: 'Rename a Cody knowledge-base folder.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Renames a Cody knowledge-base folder, identified by its ID. Resolve the folder ID via List Folders. Note Cody has no folder-delete endpoint, so folders can be created and renamed but not removed via the API. Convergent set-by-key (re-sending the same name yields the same state), so it is idempotent.',
        idempotent: true,
    },
    props: {
        folder_id: Property.ShortText({
            displayName: 'Folder ID',
            description: 'The ID of the folder to rename. Resolve via List Folders.',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            description: 'The new name for the folder.',
            required: true,
        }),
    },
    async run(context) {
        const { folder_id, name } = context.propsValue;
        const apiKey = context.auth;

        return await codyClient.post(apiKey, `/folders/${folder_id}`, { name });
    },
});
