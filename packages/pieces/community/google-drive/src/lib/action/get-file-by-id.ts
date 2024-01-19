import { googleDriveAuth } from '../../index';
import { Property, createAction } from "@activepieces/pieces-framework";
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { common } from '../common';

export const googleDriveGetResourceById = createAction({
    auth: googleDriveAuth,
    name: 'get-file-or-folder-by-id',
    displayName: 'Get File',
    description: 'Get a file folder for files/sub-folders',
    props: {
        id: Property.ShortText({
            displayName: 'File / Folder Id',
            description: 'The Id of the file/folder to search for.',
            required: true,
        })
    },
    async run(context) {
        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth)        
        const drive = google.drive({ version: 'v3', auth: authClient });
        const response = await drive.files.get({ fileId: context.propsValue.id });

        if (response.data) {
            return response.data;
        } else {
            console.log('The specified ID corresponds to a folder. Returning null.');
            return null;
        }
        
    }
});
