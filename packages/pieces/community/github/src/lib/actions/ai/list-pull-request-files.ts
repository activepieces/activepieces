import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListPullRequestFilesAction = createAction({
  auth: githubAuth,
  name: 'list_pull_request_files',
  displayName: 'List Pull Request Files (Agent)',
  description: 'Lists the files changed in a pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the files changed in a pull request (GET /repos/{owner}/{repo}/pulls/{pull_number}/files), with each file's status, additions/deletions, and patch. Use to find file paths for Create Pull Request Review Comment. Returns all pages. Read-only and idempotent.",
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
        resourceUri: `/repos/${owner}/${repo}/pulls/${pull_number}/files`,
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
