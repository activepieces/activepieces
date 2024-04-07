import { googleDriveAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { common } from '../common';

export const googleDriveSearchFolder = createAction({
  auth: googleDriveAuth,
  name: 'search-folder',
  displayName: 'Search',
  description: 'Search a Google Drive folder for files/sub-folders',
  props: {
    queryTerm: Property.StaticDropdown({
      displayName: 'Query Term',
      description: 'The Query term or field of file/folder to search upon.',
      defaultValue: 'name',
      options: {
        options: [
          { label: 'File name', value: 'name' },
          { label: 'Full text search', value: 'fullText' },
          { label: 'Content type', value: 'mimeType' },
        ],
      },
      required: true,
    }),
    operator: Property.StaticDropdown({
      displayName: 'Operator',
      description: 'The operator to create criteria.',
      required: true,
      options: {
        options: [
          { label: 'Contains', value: 'contains' },
          { label: 'Equals', value: '=' },
        ],
      },
      defaultValue: 'contains',
    }),
    query: Property.ShortText({
      displayName: 'Value',
      description: 'Value of the field of file/folder to search for.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'File Type',
      description: '(Optional) Choose between files and folders.',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Files', value: 'file' },
          { label: 'Folders', value: 'folder' },
        ],
      },
      defaultValue: 'all',
    }),
    parentFolder: common.properties.parentFolder,
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const drive = google.drive({ version: 'v3', auth: authClient });
    const operator = context.propsValue.operator ?? 'contains';
    const queryTerm = context.propsValue.queryTerm ?? 'name';
    let finalQuery = `${queryTerm} ${operator} '${context.propsValue.query}'`;
    if (context.propsValue.parentFolder) {
      finalQuery = `${finalQuery} and '${context.propsValue.parentFolder}' in parents`;
    }

    const type = context.propsValue.type ?? 'all';
    switch (type) {
      case 'file':
        finalQuery = `${finalQuery} and mimeType!='application/vnd.google-apps.folder'`;
        break;
      case 'folder':
        finalQuery = `${finalQuery} and mimeType='application/vnd.google-apps.folder'`;
        break;
      default:
        break;
    }

    const response = await drive.files.list({
      q: finalQuery,
      fields: 'files(id, name, mimeType, createdTime, modifiedTime)',
      includeItemsFromAllDrives: context.propsValue.include_team_drives,
      supportsAllDrives: true,
    });
    if (response.status !== 200) {
      console.error(response);
      throw new Error('Error searching for the file/folder');
    }

    const files = response.data.files ?? [];
    if (files.length > 0) {
      return files;
    } else {
      console.log('Resource not found');
      return [];
    }
  },
});
