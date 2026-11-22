import { createAction } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../auth';
import { cambCommon, cambOutputSchemas } from '../common';

export const listFolders = createAction({
    auth: cambaiAuth,
    name: 'list_folders',
    classification: 'SEARCH',
    displayName: 'List Folders',
    description: 'Lists the folders in the Camb.AI workspace.',
    audience: 'ai',
    outputSchema: cambOutputSchemas['listFolders'],
    aiMetadata: {
        description: 'Lists Camb.AI workspace folders with numeric folder_id and folder_name. Use the folder_id as the optional folder for the create actions. Use Create Folder to add one.',
        idempotent: true,
    },
    props: {},
    async run(context) {
        const folders = await cambCommon.listFolders({ apiKey: context.auth.secret_text });
        return { folders: folders.map((folder) => ({ folder_id: folder.folder_id, folder_name: folder.folder_name })) };
    },
});
