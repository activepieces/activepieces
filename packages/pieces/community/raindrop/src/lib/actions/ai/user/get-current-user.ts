import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropGetCurrentUserOutputSchema } from '../../../output-schemas';

export const raindropGetCurrentUserAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_get_current_user',
  outputSchema: raindropGetCurrentUserOutputSchema,
  displayName: 'Get Current User',
  description: 'Gets the profile and settings of the connected account.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Returns the connected Raindrop.io account: name, email, Pro status, storage usage, settings (config) and the sidebar collection groups. Read it before Update User, whose groups input replaces the whole list. Use Get User by Name for someone else's public profile.",
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await raindropClient.request<RaindropGetCurrentUserResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/user',
    });
  },
});

type RaindropGetCurrentUserResponse = {
  result: boolean;
  user: Record<string, unknown>;
};
