import { googleDriveAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';

export const driveSearchFiles = createAction({
  auth: googleDriveAuth,
  name: 'drive_search_files',
  displayName: 'Search Files and Folders',
  description: 'Search a Google Drive folder for files/sub-folders',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Drive for files or folders matching a name, full-text, or MIME-type query, optionally scoped to a parent folder. Use this to resolve a human-readable name into a file/folder ID before acting on it; to list a known folder\'s children use `drive_list_files` instead. Read-only.',
    idempotent: true,
  },
  props: {
    query_term: Property.StaticDropdown({
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
    value: Property.ShortText({
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
    parent_folder_id: Property.ShortText({
      displayName: 'Parent Folder ID',
      description:
        '(Optional) Restrict the search to files/folders inside this folder ID.',
      required: false,
    }),
    include_team_drives: Property.Checkbox({
      displayName: 'Include Team Drives',
      description:
        'Determines if folders from Team Drives should be included in the results.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });
    const operator = context.propsValue.operator ?? 'contains';
    const queryTerm = context.propsValue.query_term ?? 'name';
    let finalQuery = `${queryTerm} ${operator} '${context.propsValue.value}'`;
    if (context.propsValue.parent_folder_id) {
      finalQuery = `${finalQuery} and '${context.propsValue.parent_folder_id}' in parents`;
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

    const allFiles: any[] = [];
    let pageToken: string | undefined = undefined;
    do {
      const listParams: Record<string, any> = {
        q: finalQuery,
        fields:
          'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime)',
        includeItemsFromAllDrives: context.propsValue.include_team_drives,
        supportsAllDrives: true,
        corpora: context.propsValue.include_team_drives ? 'allDrives' : 'user',
        pageSize: 1000,
      };
      if (pageToken) listParams.pageToken = pageToken;
      const response = await drive.files.list(listParams);
      if (response.status !== 200) {
        console.error(response);
        throw new Error('Error searching for the file/folder');
      }
      allFiles.push(...(response.data.files ?? []));
      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);

    if (allFiles.length > 0) {
      return allFiles;
    } else {
      console.log('Resource not found');
      return [];
    }
  },
});
