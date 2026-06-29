import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListPullRequestReviewsAction = createAction({
  auth: githubAuth,
  name: 'list_pull_request_reviews',
  displayName: 'List Pull Request Reviews (Agent)',
  description: 'Lists the reviews submitted on a pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the reviews on a pull request (GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews), each with its state (APPROVED, CHANGES_REQUESTED, COMMENTED), body, and reviewer. For the inline code comments use List Pull Request Review Comments. Returns all pages. Read-only and idempotent.',
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
        resourceUri: `/repos/${owner}/${repo}/pulls/${pull_number}/reviews`,
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
