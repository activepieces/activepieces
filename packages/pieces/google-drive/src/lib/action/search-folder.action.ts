/* eslint-disable @typescript-eslint/no-explicit-any */
import { googleDriveAuth } from '../../index';
import { Property, createAction } from "@activepieces/pieces-framework";
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const googleDriveSearchFolder = createAction({
    auth: googleDriveAuth,
    name: 'search-folder',
    displayName: 'Search folder',
    description: 'Search folder from a Google Drive folder',
    props: {
        query: Property.ShortText({
            displayName: 'Name',
            description: 'Name to search for',
            required: true,
        }),
        folderId: Property.ShortText({
            displayName: 'Folder ID',
            description: '(Optional) The ID of the folder where the folder will be searched',
            required: false,
        }),
    },
    async run (context) {

        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth)

        const drive = google.drive({ version: 'v3', auth: authClient });
        
        let query = `name contains '${context.propsValue.query}' and mimeType='application/vnd.google-apps.folder'`;
        if (context.propsValue.folderId)
            query = `${query} and '${context.propsValue.folderId}' in parents`

        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name)'
        });
        
        if (response.status !== 200) {
            console.error(response);
            throw new Error('Error searching folder');
        }

        const folders = response.data.files ?? [];
        
        if (folders.length > 0) {
            return folders;
        } else {
            console.log('Folder not found');
            return [];
        }        
    }
});
