import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubMergePullRequestAction = createAction({
  auth: githubAuth,
  name: 'merge_pull_request',
  displayName: 'Merge Pull Request (Agent)',
  description: 'Merges an open pull request into its base branch.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Merges an open pull request into its base branch (PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge) using merge, squash, or rebase. DESTRUCTIVE and irreversible — it writes commits to the base branch. Optionally pin to a head sha so it only merges if the PR has not changed. Not idempotent: re-merging an already-merged PR returns 405.',
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
    merge_method: Property.StaticDropdown({
      displayName: 'Merge Method',
      required: false,
      options: {
        options: [
          { label: 'Merge', value: 'merge' },
          { label: 'Squash', value: 'squash' },
          { label: 'Rebase', value: 'rebase' },
        ],
      },
    }),
    commit_title: Property.ShortText({
      displayName: 'Commit Title',
      required: false,
    }),
    commit_message: Property.LongText({
      displayName: 'Commit Message',
      required: false,
    }),
    sha: Property.ShortText({
      displayName: 'Head SHA',
      description:
        'If set, the merge only proceeds when the PR head still matches this SHA (get via Get Pull Request).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      owner,
      repo,
      pull_number,
      merge_method,
      commit_title,
      commit_message,
      sha,
    } = propsValue;
    const body: Record<string, unknown> = {};
    if (merge_method !== undefined) body['merge_method'] = merge_method;
    if (commit_title !== undefined) body['commit_title'] = commit_title;
    if (commit_message !== undefined) body['commit_message'] = commit_message;
    if (sha !== undefined) body['sha'] = sha;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.PUT,
        resourceUri: `/repos/${owner}/${repo}/pulls/${pull_number}/merge`,
        body,
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 405)
        throw new Error(
          `Pull request #${pull_number} is not mergeable (already merged, or merge blocked).`
        );
      if (status === 409)
        throw new Error(
          'Head SHA mismatch — the PR changed since you read the sha.'
        );
      throw githubError(
        error,
        `Pull request #${pull_number} in ${owner}/${repo}`
      );
    }
  },
});
