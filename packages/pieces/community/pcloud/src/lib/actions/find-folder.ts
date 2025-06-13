import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { pcloudAuth } from '../../index';

export const findFolderAction = createAction({
  auth: pcloudAuth,
  name: 'find_folder',
  displayName: 'Find Folder',
  description: 'Search for folders in pCloud',
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Term to search for in folder names',
      required: true,
    }),
    parentFolderId: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'The parent folder ID to search in (0 for root)',
      required: true,
      defaultValue: 0,
    }),
    recursive: Property.Checkbox({
      displayName: 'Search Subfolders',
      description: 'Search in all subfolders as well',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ propsValue, auth }) {
    const response = await makeRequest(
      (auth as { access_token: string }).access_token,
      HttpMethod.GET,
      '/listfolder',
      null,
      {
        folderid: propsValue.parentFolderId.toString(),
        recursive: propsValue.recursive ? '1' : '0',
      }
    );

    // Filter folders matching the search term
    if (response && response.metadata && response.metadata.contents) {
      const filteredFolders = response.metadata.contents.filter((item: any) => {
        return item.isfolder && item.name.toLowerCase().includes(propsValue.searchTerm.toLowerCase());
      });

      return {
        ...response,
        metadata: {
          ...response.metadata,
          contents: filteredFolders,
        },
        count: filteredFolders.length,
      };
    }

    return response;
  },
});
