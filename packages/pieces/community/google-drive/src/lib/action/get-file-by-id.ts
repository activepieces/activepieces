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
        }),
        type: Property.StaticDropdown({
            displayName: 'File Type',
            description: '(Optional) Choose between files and folders.',
            required: false,
            options: {
                options: [
                    { label: "All", value: "all" },
                    { label: "Files", value: "file" },
                    { label: "Folders", value: "folder" },
                ],
            },
            defaultValue: 'all'
        }),
        parentFolder: common.properties.parentFolder,
    },
    async run(context) {
        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth)        
        const drive = google.drive({ version: 'v3', auth: authClient });
        const response = await drive.files.get({ fileId: context.propsValue.id });

        const type = context.propsValue.type ?? "all";
        switch(type){
            case "all":
                return response.data;
            case "file":
                if (response.data.mimeType !== 'application/vnd.google-apps.folder') {
                    return response.data;
                }
                break;
            case "folder":
                if (response.data.mimeType === 'application/vnd.google-apps.folder') {
                    return response.data;
                }
                break;
            default:
                break;
        }

        console.log('The specified ID corresponds to a folder. Returning null.');
        return null;
    }
});
