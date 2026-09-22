import { createAction } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { userAccountActionOutputSchema } from '../output-schemas';

export const getUserAccount = createAction({
  auth: pinterestAuth,
  name: 'getUserAccount',
  classification: 'READ',
  outputSchema: userAccountActionOutputSchema,
  displayName: 'Get User Account',
  description: 'Read the profile of the connected Pinterest account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the connected account profile: username, account type, display name, website, and pin, board and follower counts. Use it to confirm which account a connection belongs to before writing content, or to report follower totals. Takes no input and never changes anything; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      '/user_account'
    );
  },
});
