import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubUnstarRepositoryAction = createAction({
  auth: githubAuth,
  name: 'unstar_repository',
  displayName: 'Unstar Repository (Agent)',
  description: 'Removes a star from a repository for the connected user.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Removes the connected user's star from a repository (DELETE /user/starred/{owner}/{repo}). User-context — not available under GitHub App auth. Idempotent: unstarring an already-unstarred repo leaves it unstarred.",
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.DELETE,
        resourceUri: `/user/starred/${owner}/${repo}`,
      });
      return { success: true, status: response.status, starred: false };
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
