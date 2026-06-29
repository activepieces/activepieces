import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubStarRepositoryAction = createAction({
  auth: githubAuth,
  name: 'star_repository',
  displayName: 'Star Repository (Agent)',
  description: 'Stars a repository for the connected user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Stars a repository for the connected user (PUT /user/starred/{owner}/{repo}). User-context — not available under GitHub App auth (a bot has no stars). Idempotent: re-starring an already-starred repo keeps it starred.',
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
        method: HttpMethod.PUT,
        resourceUri: `/user/starred/${owner}/${repo}`,
      });
      return { success: true, status: response.status, starred: true };
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
