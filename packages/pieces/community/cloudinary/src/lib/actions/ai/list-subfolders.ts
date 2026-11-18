import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryListRootFoldersOutputSchema } from '../../output-schemas';

export const cloudinaryListSubfolders = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_subfolders',
  outputSchema: cloudinaryListRootFoldersOutputSchema,
  displayName: 'List Subfolders',
  description: 'Lists the direct subfolders of a folder.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the direct subfolders of a folder path (name, path, external_id). Root folders come from List Root Folders. Fails with Not found if the folder does not exist. Pages with next_cursor.',
    idempotent: true,
  },
  props: {
    folder: Property.ShortText({
      displayName: 'Folder Path',
      description: 'Full folder path (e.g. "marketing/banners").',
      required: true,
    }),
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const response: FolderList = await makeRequest(auth, HttpMethod.GET, `/folders/${aiResults.encodePath({ value: propsValue.folder })}`, undefined, {
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
