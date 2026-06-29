import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubCreatePullRequestReviewAction = createAction({
  auth: githubAuth,
  name: 'create_pull_request_review',
  displayName: 'Create Pull Request Review (Agent)',
  description: 'Submits a review on a pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Submits a review on a pull request (POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews) with an event of APPROVE, REQUEST_CHANGES, or COMMENT and an optional summary body. Omit the event to create a PENDING review. Optional inline comments array each needs path + position/line. For a single inline comment use Create Pull Request Review Comment instead. Not idempotent: each call adds a new review.',
    idempotent: false,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    pull_number: Property.Number({
      displayName: 'Pull Request Number',
      description: 'The pull request number. Resolve via List Pull Requests.',
      required: true,
    }),
    event: Property.StaticDropdown({
      displayName: 'Event',
      description: 'The review action. Omit to leave the review pending.',
      required: false,
      options: {
        options: [
          { label: 'Approve', value: 'APPROVE' },
          { label: 'Request Changes', value: 'REQUEST_CHANGES' },
          { label: 'Comment', value: 'COMMENT' },
        ],
      },
    }),
    body: Property.LongText({
      displayName: 'Body',
      description:
        'The review summary text (required for REQUEST_CHANGES/COMMENT).',
      required: false,
    }),
    commit_id: Property.ShortText({
      displayName: 'Commit SHA',
      description:
        'The SHA the review applies to (defaults to the latest). Get via Get Pull Request.',
      required: false,
    }),
    comments: Property.Json({
      displayName: 'Inline Comments',
      description:
        'Optional array of inline comments, e.g. [{"path":"file.ts","position":5,"body":"..."}].',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, pull_number, event, body, commit_id, comments } =
      propsValue;
    const requestBody: Record<string, unknown> = {};
    if (event !== undefined) requestBody['event'] = event;
    if (body !== undefined) requestBody['body'] = body;
    if (commit_id !== undefined) requestBody['commit_id'] = commit_id;
    if (comments !== undefined) requestBody['comments'] = comments;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/repos/${owner}/${repo}/pulls/${pull_number}/reviews`,
        body: requestBody,
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
