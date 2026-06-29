import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubUpdatePullRequestAction = createAction({
  auth: githubAuth,
  name: 'update_pull_request',
  displayName: 'Update Pull Request (Agent)',
  description: 'Edits a pull request, including closing or reopening it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits a pull request (PATCH /repos/{owner}/{repo}/pulls/{pull_number}), setting only the fields you provide — title, body, state (open/closed), or base branch. Use to modify, close, or reopen a PR (no separate close action). Idempotent: applying the same values again leaves the PR in the same state.',
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
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      description: 'Open or close the pull request.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    base: Property.ShortText({
      displayName: 'Base Branch',
      description: 'Change the base branch the PR targets.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, pull_number } = propsValue;
    const body: Record<string, unknown> = {};
    if (propsValue.title !== undefined) body['title'] = propsValue.title;
    if (propsValue.body !== undefined) body['body'] = propsValue.body;
    if (propsValue.state !== undefined) body['state'] = propsValue.state;
    if (propsValue.base !== undefined) body['base'] = propsValue.base;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.PATCH,
        resourceUri: `/repos/${owner}/${repo}/pulls/${pull_number}`,
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
