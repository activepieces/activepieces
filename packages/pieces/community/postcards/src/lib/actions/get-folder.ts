import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { postcardsAuth, POSTCARDS_BASE_URL } from '../auth';

export const getFolder = createAction({
  auth: postcardsAuth,
  name: 'get_folder',
  displayName: 'Get Folder',
  description:
    'Get a single folder and the projects directly inside it. The ID is either the numeric id or the obfuscated_id. The projects array is paginated (50/page, max 100).',
  props: {
    id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Numeric id or obfuscated_id.',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: '1-based page number for the projects array.',
      required: false,
      defaultValue: 1,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Items per page for the projects array (max 100).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { id, page, per_page } = context.propsValue;
    const queryParams: Record<string, string> = {};
    if (page != null) queryParams['page'] = String(page);
    if (per_page != null) queryParams['per_page'] = String(per_page);

    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${POSTCARDS_BASE_URL}/api/v1/folders/${id}`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      queryParams,
    });
    return res.body;
  },
});
