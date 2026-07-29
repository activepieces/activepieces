import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { postcardsAuth, POSTCARDS_BASE_URL } from '../auth';

export const listFolders = createAction({
  auth: postcardsAuth,
  name: 'list_folders',
  displayName: 'List Folders',
  description:
    'List all folders in the authenticated team. Paginated (50/page, max 100). Folders can be nested via parent_id.',
  props: {
    page: Property.Number({
      displayName: 'Page',
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
    const { page, per_page } = context.propsValue;
    const queryParams: Record<string, string> = {};
    if (page != null) queryParams['page'] = String(page);
    if (per_page != null) queryParams['per_page'] = String(per_page);

    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${POSTCARDS_BASE_URL}/api/v1/folders`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      queryParams,
    });
    return res.body;
  },
});
