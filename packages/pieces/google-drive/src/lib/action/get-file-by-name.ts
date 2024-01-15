/* eslint-disable @typescript-eslint/no-explicit-any */
import { googleDriveAuth } from '../../index';
import { Property, createAction } from "@activepieces/pieces-framework";
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const googleDriveGetFileByName = createAction({
  auth: googleDriveAuth,
  name: 'get-file-by-name',
  displayName: 'Get File By Name',
  description: 'Get file/folder from the Google Drive root or folder provided',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name to search for',
      required: true,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: '(Optional) Parent folder to find the file. Will search in root folder if not selected.',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'File Type',
      description: '(Optional) The Mime type of the file.',
      required: false,
      defaultValue: "all",
      options: {
        options: [
          { label: "File", value: "file" },
          { label: "Folder", value: "folder" },
        ]
      }
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth)

    const drive = google.drive({ version: 'v3', auth: authClient });
    let query = `name='${context.propsValue.name}'`;

    if (context.propsValue.type === "folder") {
      query = `${query} and mimeType='application/vnd.google-apps.folder'`
    } else if (context.propsValue.type === "file") {
      query = `${query} and mimeType!='application/vnd.google-apps.folder'`
    }

    if (context.propsValue.folderId) {
      query = `${query} and '${context.propsValue.folderId}' in parents`
    } else {
      query = `${query} and 'root' in parents`
    }

    const response = await drive.files.list({ q: query, fields: 'files(id, name, mimeType)' });

    if (response.status !== 200) {
      console.error(response);
      throw new Error('Error searching file');
    }

    const files = response.data.files ?? [];

    if (files.length == 1) {
      return files[0]
    } else if (files.length > 1) {
      return files
    } else {
      console.log('File not found');
      return []
    }
  }
});
