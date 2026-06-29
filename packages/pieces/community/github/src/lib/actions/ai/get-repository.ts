import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubGetRepositoryAction = createAction({
  auth: githubAuth,
  name: 'get_repository',
  displayName: 'Get Repository (Agent)',
  description: 'Fetches metadata for a single repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single repository (GET /repos/{owner}/{repo}) including its default_branch, visibility, and your permissions. Use to discover the default branch before file or branch operations. Read-only and idempotent.',
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
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}`,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
