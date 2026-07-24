import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubListUserRepositoriesAction = createAction({
  auth: githubAuth,
  name: 'list_user_repositories',
  displayName: 'List User Repositories (Agent)',
  description: "Lists a specific user's public repositories.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the public repositories owned by a specific user (GET /users/{username}/repos). For the connected account's own repos (including private) use List My Repositories. Returns all pages. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The user login whose repositories to list.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { username } = propsValue;
    try {
      const items = await githubPaginatedApiCall<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/users/${username}/repos`,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `User "${username}"`);
    }
  },
});
