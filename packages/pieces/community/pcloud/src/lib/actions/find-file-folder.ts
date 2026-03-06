import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { pCloudAuth } from '../auth';
import { pCloudFolderIdProp, searchItems } from '../common';

export const findFileFolder = createAction({
  auth: pCloudAuth,
  name: 'find_file_folder',
  displayName: 'Find File/Folder',
  description:
    'Search for files or folders in pCloud by name. Returns all matches found within the specified folder (and its subfolders).',
  props: {
    search_query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'The text to search for in file/folder names. The search is case-insensitive and matches partial names.',
      required: true,
    }),
    search_in_folder_id: pCloudFolderIdProp,
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Filter results to only files, only folders, or both.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'Files and Folders', value: 'all' },
          { label: 'Files Only', value: 'files' },
          { label: 'Folders Only', value: 'folders' },
        ],
      },
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const query = context.propsValue.search_query;
    const folderId = context.propsValue.search_in_folder_id ?? '0';
    const searchType = (context.propsValue.search_type as 'all' | 'files' | 'folders') ?? 'all';

    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty.');
    }

    const results = await searchItems(auth, folderId, query.trim(), searchType);

    return {
      count: results.length,
      items: results,
    };
  },
});
