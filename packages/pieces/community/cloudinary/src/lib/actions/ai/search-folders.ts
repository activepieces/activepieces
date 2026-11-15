import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinarySearchFoldersOutputSchema } from '../../output-schemas';

export const cloudinarySearchFolders = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_search_folders',
  outputSchema: cloudinarySearchFoldersOutputSchema,
  displayName: 'Search Folders',
  description: 'Searches folders by name, path or creation date.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds folders anywhere in the tree with an expression on name, path, id or created_at, e.g. `name:banners`, `path:marketing/*`, `created_at>1w`. Returns name, path, external_id and created_at for each. Pages with next_cursor (max 500).',
    idempotent: true,
  },
  props: {
    expression: Property.ShortText({
      displayName: 'Expression',
      description: 'Search expression (e.g. "name:banners"). Leave empty to list all folders.',
      required: false,
    }),
    sort_by: Property.ShortText({
      displayName: 'Sort By Field',
      description: 'Field to sort by (e.g. "name", "created_at").',
      required: false,
    }),
    sort_direction: aiProps.direction(),
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const sortBy = propsValue.sort_by?.trim();
    const response: FolderSearch = await makeRequest(auth, HttpMethod.POST, '/folders/search', {
      ...(propsValue.expression ? { expression: propsValue.expression } : {}),
      ...(sortBy ? { sort_by: [{ [sortBy]: propsValue.sort_direction ?? 'desc' }] } : {}),
      ...(propsValue.max_results !== undefined && propsValue.max_results !== null ? { max_results: aiResults.clampMaxResults({ value: propsValue.max_results }) } : {}),
      ...(propsValue.next_cursor ? { next_cursor: propsValue.next_cursor } : {}),
    });
    return {
      folders: response.folders,
      count: response.folders.length,
      total_count: response.total_count ?? null,
      next_cursor: response.next_cursor ?? null,
    };
  },
});

type FolderSearch = { folders: Record<string, unknown>[]; next_cursor?: string; total_count?: number };
