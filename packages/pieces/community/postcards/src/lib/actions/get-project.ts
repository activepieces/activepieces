import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { postcardsAuth, POSTCARDS_BASE_URL } from '../auth';

export const getProject = createAction({
  auth: postcardsAuth,
  name: 'get_project',
  displayName: 'Get Project',
  description:
    'Get metadata for a single project. The ID is either the numeric id (e.g. 305876) or the obfuscated_id (e.g. 32b3f40e).',
  props: {
    id: Property.ShortText({
      displayName: 'Project ID',
      description: 'Numeric id or obfuscated_id.',
      required: true,
    }),
  },
  async run(context) {
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${POSTCARDS_BASE_URL}/api/v1/projects/${context.propsValue.id}`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
    });
    return res.body;
  },
});
