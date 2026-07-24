import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListPullRequestCommitsAction = createAction({
  auth: githubAuth,
  name: 'list_pull_request_commits',
  displayName: 'List Pull Request Commits (Agent)',
  description: 'Lists the commits in a pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the commits contained in a pull request (GET /repos/{owner}/{repo}/pulls/{pull_number}/commits). Returns all pages. Read-only and idempotent.',
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
      const items = await githubPaginatedApiCall<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/pulls/${pull_number}/commits`,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(
        error,
        `Pull request #${pull_number} in ${owner}/${repo}`
      );
    }
  },
});
