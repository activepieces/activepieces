import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubRequestPullRequestReviewersAction = createAction({
  auth: githubAuth,
  name: 'request_pull_request_reviewers',
  displayName: 'Request Pull Request Reviewers (Agent)',
  description: 'Requests reviews from users or teams on a pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Requests reviews on a pull request (POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers) from user logins and/or team slugs. Provide at least one of reviewers or team_reviewers. Resolve logins via List Collaborators or Search Users. Idempotent: re-requesting an already-requested reviewer leaves the request in place.',
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
    reviewers: Property.Array({
      displayName: 'Reviewers',
      description: 'User logins to request a review from.',
      required: false,
    }),
    team_reviewers: Property.Array({
      displayName: 'Team Reviewers',
      description: 'Team slugs to request a review from.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, pull_number } = propsValue;
    const body: Record<string, unknown> = {};
    const reviewers = propsValue.reviewers as string[] | undefined;
    const teamReviewers = propsValue.team_reviewers as string[] | undefined;
    if (reviewers && reviewers.length > 0) body['reviewers'] = reviewers;
    if (teamReviewers && teamReviewers.length > 0)
      body['team_reviewers'] = teamReviewers;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/repos/${owner}/${repo}/pulls/${pull_number}/requested_reviewers`,
        body,
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
