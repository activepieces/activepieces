/* eslint-disable @typescript-eslint/no-explicit-any */
import { googleDriveAuth } from '../../index';
import { Property, createAction } from "@activepieces/pieces-framework";
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { common } from '../common';

export const googleDriveSearchFolder = createAction({
  auth: googleDriveAuth,
  name: 'search-folder',
  displayName: 'Search a Folder',
  description: 'Search a Google Drive folder for files/sub-folders',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name to search for',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'File Type',
      description: '(Optional) Choose between files and folders.',
      required: false,
      options: {
        options: [
          { label: "Files", value: "file" },
          { label: "Folders", value: "folder" },
        ]
      }
    }),
    parentFolder: common.properties.parentFolder,
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth)
    
    const drive = google.drive({ version: 'v3', auth: authClient });
    let query = `name contains '${context.propsValue.name}' and '${context.propsValue.parentFolder ?? 'root'}' in parents`;

    if (context.propsValue.type === "folder") {
      query = `${query} and mimeType='application/vnd.google-apps.folder'`
    } else if (context.propsValue.type === "file") {
      query = `${query} and mimeType!='application/vnd.google-apps.folder'`
    }

    const response = await drive.files.list({ q: query, fields: 'files(id, name, mimeType)' });
    if (response.status !== 200) {
      console.error(response);
      throw new Error('Error searching file');
    }

    const files = response.data.files ?? [];
    if(files.length > 0) {
      return files
    } else {
      console.log('File not found');
      return []
    }
  }
});
