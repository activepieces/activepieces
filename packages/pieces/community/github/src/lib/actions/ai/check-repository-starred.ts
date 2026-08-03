import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubCheckRepositoryStarredAction = createAction({
  auth: githubAuth,
  name: 'check_repository_starred',
  displayName: 'Check Repository Starred (Agent)',
  description: 'Checks whether the connected user has starred a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Checks whether the connected user has starred a repository (GET /user/starred/{owner}/{repo}; 204 = starred, 404 = not starred). Returns { starred: boolean }. User-context — unavailable under GitHub App auth. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue;
    try {
      await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/user/starred/${owner}/${repo}`,
      });
      return { starred: true };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        return { starred: false };
      }
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
