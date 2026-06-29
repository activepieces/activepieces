import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubGetPullRequestAction = createAction({
  auth: githubAuth,
  name: 'get_pull_request',
  displayName: 'Get Pull Request (Agent)',
  description: 'Fetches a single pull request by number.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single pull request (GET /repos/{owner}/{repo}/pulls/{pull_number}), including its mergeable state and head/base commit SHAs (head.sha feeds Create Pull Request Review Comment). Resolve PR numbers via List Pull Requests. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    pull_number: Property.Number({
      displayName: 'Pull Request Number',
      description: 'The pull request number. Resolve via List Pull Requests.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, pull_number } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/pulls/${pull_number}`,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(
        error,
        `Pull request #${pull_number} in ${owner}/${repo}`
      );
    }
  },
});
