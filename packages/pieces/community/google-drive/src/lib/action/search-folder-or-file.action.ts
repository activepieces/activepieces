import { googleDriveAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { common } from '../common';
import { searchFolderActionOutputSchema } from '../output-schemas';

export const googleDriveSearchFolder = createAction({
  auth: googleDriveAuth,
  name: 'search-folder',
  classification: 'SEARCH',
  displayName: 'Find File or Folder',
  description: 'Find files or folders by name, content or type.',
  audience: 'human',
  aiMetadata: { description: 'Searches Google Drive for files or folders matching a name, full-text, or MIME-type query, optionally scoped to a parent folder and filtered to files or folders only. Use to resolve a file/folder ID from a human-readable name before acting on it. Read-only and idempotent.', idempotent: true },
  props: {
    queryTerm: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Match the file name, the text inside it, or its type.',
      defaultValue: 'name',
      options: {
        options: [
          { label: 'File Name', value: 'name' },
          { label: 'Text Inside the File', value: 'fullText' },
          { label: 'File Type', value: 'mimeType' },
        ],
      },
      required: true,
    }),
    operator: Property.StaticDropdown({
      displayName: 'Match',
      description: 'Contains finds partial matches; Equals needs the exact value.',
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
      displayName: 'Search Text',
      description: 'The name, text or type to look for.',
      required: true,
      placeholder: 'Quarterly report',
    }),
    type: Property.StaticDropdown({
      displayName: 'Show',
      description: 'Return everything, only files or only folders.',
      required: false,
      options: {
        options: [
          { label: 'Files and Folders', value: 'all' },
          { label: 'Files Only', value: 'file' },
          { label: 'Folders Only', value: 'folder' },
        ],
      },
      defaultValue: 'all',
    }),
    parentFolder: common.parentFolderDropdown({
      displayName: 'Search in Folder',
      description: 'Leave empty to search all of Drive. Type to search by folder name.',
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  outputSchema: searchFolderActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });
    const operator = context.propsValue.operator ?? 'contains';
    const queryTerm = context.propsValue.queryTerm ?? 'name';
    let finalQuery = `${queryTerm} ${operator} '${common.escapeDriveQueryLiteral(context.propsValue.query)}'`;
    if (context.propsValue.parentFolder) {
      finalQuery = `${finalQuery} and '${common.escapeDriveQueryLiteral(context.propsValue.parentFolder)}' in parents`;
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
        fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime)',
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
      return [];
    }
  },
});
