import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubGetAuthenticatedUserAction = createAction({
  auth: githubAuth,
  name: 'get_authenticated_user',
  displayName: 'Get Authenticated User (Agent)',
  description: 'Returns the profile of the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the profile of the connected account (GET /user) — the "who am I" call whose login feeds self-scoped operations. Under GitHub App auth this reflects the bot identity (e.g. "app-name[bot]"), not a human user. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/user`,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, 'The authenticated user');
    }
  },
});
