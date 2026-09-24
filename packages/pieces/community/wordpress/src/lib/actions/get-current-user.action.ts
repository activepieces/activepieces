import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { getCurrentUserOutputSchema } from '../output-schemas';

export const getCurrentUserAction = createAction({
  auth: wordpressAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Gets the WordPress user this connection signs in as, with roles and capabilities.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the WordPress user the connection authenticates as: ID, name, email, roles and capabilities. Use it to check that the connection works and whether the role allows a write (for example edit_pages, moderate_comments, manage_categories) before attempting it. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getCurrentUserOutputSchema,
  props: {},
  async run({ auth }) {
    const response = await wordpressApi.request<WordpressRecord>({
      auth,
      method: HttpMethod.GET,
      path: '/users/me',
      queryParams: { context: 'edit' },
    });
    return response.body;
  },
});
