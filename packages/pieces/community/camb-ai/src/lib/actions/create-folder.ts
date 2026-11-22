import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../auth';
import { cambCommon, cambOutputSchemas } from '../common';

export const createFolder = createAction({
    auth: cambaiAuth,
    name: 'create_folder',
    classification: 'WRITE',
    displayName: 'Create Folder',
    description: 'Creates a folder to organise tasks in your Camb.AI workspace.',
    audience: 'both',
    outputSchema: cambOutputSchemas['createFolder'],
    aiMetadata: {
        description: 'Creates a Camb.AI workspace folder and returns its folder_id, which the create actions accept as folder. Check List Folders first to avoid duplicates. Not idempotent: each call creates a folder.',
        idempotent: false,
    },
    props: {
        folder_name: Property.ShortText({
            displayName: 'Folder Name',
            description: 'Between 3 and 255 characters.',
            required: true,
        }),
    },
    async run(context) {
        return cambCommon.createFolder({ apiKey: context.auth.secret_text, folderName: context.propsValue.folder_name });
    },
});
