import { createAction, Property } from '@activepieces/pieces-framework';
import { vlmRunAuth, vlmRunCommon } from '../common/common';

export const getFileAction = createAction({
    auth: vlmRunAuth,
    name: 'get_file',
    displayName: 'Get File',
    description: "Gets a file's metadata by its ID.",
    props: {
        fileId: Property.ShortText({
            displayName: 'File ID',
            description: 'The ID of the file to retrieve. You can get this from the "List Files" action.',
            required: true,
        }),
    },
    
    async run({ auth, propsValue }) {
        return await vlmRunCommon.getFile({
            apiKey: auth,
            file_id: propsValue.fileId,
        });
    },
});