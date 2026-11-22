import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const getCurrentUser = createAction({
  auth: villageAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description:
    "Get profile information for the authenticated user — id, email, name, account creation date, sync completion status, and active flag. Useful for verifying auth and checking whether the user's network data is ready.",
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the authenticated user\'s own profile, including their ID and a sync-completion flag. Read-only and idempotent. Use to confirm the token is valid and to check whether the user\'s network data has finished syncing before relying on graph queries.',
    idempotent: true,
  },
  outputSchema: villageSchemas.getCurrentUser,
  props: {},
  async run(context) {
    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/user/me`,
    });
    return response;
  },
});
