import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const getCurrentUser = createAction({
  auth: villageAuth,
  name: 'get_current_user',
  displayName: 'Get Current User',
  description:
    "Get profile information for the authenticated user — id, email, name, account creation date, sync completion status, and active flag. Useful for verifying auth and checking whether the user's network data is ready.",
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the authenticated user\'s own profile, including their ID and a sync-completion flag. Read-only and idempotent. Use to confirm the token is valid and to check whether the user\'s network data has finished syncing before relying on graph queries.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${VILLAGE_API_BASE_URL}/v2/user/me`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
    });
    return response.body;
  },
});
