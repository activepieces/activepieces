import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryListRootFoldersOutputSchema } from '../../output-schemas';

export const cloudinaryListRootFolders = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_root_folders',
  outputSchema: cloudinaryListRootFoldersOutputSchema,
  displayName: 'List Root Folders',
  description: 'Lists the top-level folders of the media library.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the top-level folders (name, path, external_id). Use List Subfolders to go deeper, or Search Folders to find folders by name or path anywhere. Pages with next_cursor (max 500).',
    idempotent: true,
  },
  props: {
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const response: FolderList = await makeRequest(auth, HttpMethod.GET, '/folders', undefined, {
      max_results: aiResults.clampMaxResults({ value: propsValue.max_results }),
      next_cursor: propsValue.next_cursor,
    });
    return {
      folders: response.folders,
      count: response.folders.length,
      total_count: response.total_count ?? null,
      next_cursor: response.next_cursor ?? null,
    };
  },
});

type FolderList = { folders: Record<string, unknown>[]; next_cursor?: string; total_count?: number };
