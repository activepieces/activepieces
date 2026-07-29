import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { postcardsAuth, POSTCARDS_BASE_URL } from '../auth';

export const listProjects = createAction({
  auth: postcardsAuth,
  name: 'list_projects',
  displayName: 'List Projects',
  description:
    'List projects in the authenticated team, ordered by most-recently edited. Paginated (50/page, max 100).',
  props: {
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description:
        'Filter by folder (numeric id or obfuscated_id). Leave empty to list all projects.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: '1-based page number.',
      required: false,
      defaultValue: 1,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Items per page (max 100).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { folder_id, page, per_page } = context.propsValue;
    const queryParams: Record<string, string> = {};
    if (folder_id) queryParams['folder_id'] = folder_id;
    if (page != null) queryParams['page'] = String(page);
    if (per_page != null) queryParams['per_page'] = String(per_page);

    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${POSTCARDS_BASE_URL}/api/v1/projects`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      queryParams,
    });
    return res.body;
  },
});
