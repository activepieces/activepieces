import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { pcloudAuth } from '../../index';

export const findFileAction = createAction({
  auth: pcloudAuth,
  name: 'find_file',
  displayName: 'Find File',
  description: 'Search for files in pCloud',
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Term to search for in file names',
      required: true,
    }),
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'The folder ID to search in (0 for root, searches all subfolders too)',
      required: true,
      defaultValue: 0,
    }),
    fileType: Property.StaticDropdown({
      displayName: 'File Type',
      description: 'Filter by file type',
      required: false,
      options: {
        options: [
          { label: 'All Files', value: 'all' },
          { label: 'Documents', value: 'document' },
          { label: 'Images', value: 'image' },
          { label: 'Videos', value: 'video' },
          { label: 'Audio', value: 'audio' },
        ],
      },
      defaultValue: 'all',
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of files to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ propsValue, auth }) {
    const params: Record<string, string> = {
      folderid: propsValue.folderId.toString(),
      pattern: propsValue.searchTerm,
      limit: propsValue.limit?.toString() || '10',
      recursive: '1',
    };

    if (propsValue.fileType && propsValue.fileType !== 'all') {
      params['category'] = propsValue.fileType;
    }

    const response = await makeRequest(
      (auth as { access_token: string }).access_token,
      HttpMethod.GET,
      '/searchfile',
      null,
      params
    );

    return response;
  },
});
