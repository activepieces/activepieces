import { googleDocsAuth } from "../../index";
import { DropdownOption, PiecePropValueSchema, Property } from "@activepieces/pieces-framework";
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const folderIdProp = Property.Dropdown({
    displayName:'Folder',
    refreshers:[],
    required:false,
    async options({auth}) {
        if(!auth)
        {
            return{
                disabled:true,
                placeholder:'Please connect to your Google Drive account.'
            }
        }
        const authValue = auth as PiecePropValueSchema<typeof googleDocsAuth>;

        const authClient = new OAuth2Client();
        authClient.setCredentials(authValue);

        const drive = google.drive({ version: 'v3', auth: authClient });

        const options :DropdownOption<string>[] = [];

        let nextPageToken;

        do
        {
            const response = await drive.files.list({
                q:"mimeType='application/vnd.google-apps.folder' and trashed = false",
                supportsAllDrives:true,
                includeItemsFromAllDrives:true,
                pageToken:nextPageToken
            });

            

            nextPageToken = response.data.nextPageToken;
        }while(nextPageToken)
        
    },
})