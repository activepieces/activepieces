import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubGetBranchAction = createAction({
  auth: githubAuth,
  name: 'get_branch',
  displayName: 'Get Branch (Agent)',
  description: 'Fetches a single branch including its tip commit.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single branch (GET /repos/{owner}/{repo}/branches/{branch}), including its tip commit SHA and protection settings. Use to read the head SHA before creating a branch or comparing. Resolve branch names via List Branches. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    branch: Property.ShortText({
      displayName: 'Branch',
      description: 'The branch name. Resolve via List Branches.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, branch } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/branches/${branch}`,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Branch "${branch}" in ${owner}/${repo}`);
    }
  },
});
