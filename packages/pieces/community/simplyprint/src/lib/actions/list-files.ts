import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

/**
 * Wraps `files/GetFiles` — the main folder-and-file browser endpoint.
 * Returns the whole response body (files, folders, breadcrumbs, space stats)
 * so callers can use whichever pieces they need.
 */
export const listFilesAction = createAction({
  auth: simplyprintAuth,
  name: 'list_files',
  displayName: 'List Files',
  description:
    'List files in your SimplyPrint account, optionally within a folder and/or filtered by a search term.',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'Leave empty (or 0) to list root-level files. Use -1 for the "all files" flat view.',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Optional filter by filename (substring match).',
      required: false,
    }),
    globalSearch: Property.Checkbox({
      displayName: 'Search all folders',
      description: 'When a search term is provided, search across every folder instead of just the current one.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};
    if (typeof context.propsValue.folderId === 'number') {
      queryParams['f'] = String(context.propsValue.folderId);
    }
    if (context.propsValue.search) {
      queryParams['search'] = context.propsValue.search;
      if (context.propsValue.globalSearch !== false) {
        queryParams['global_search'] = '1';
      }
    }
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: 'files/GetFiles',
      queryParams,
    });
  },
});
