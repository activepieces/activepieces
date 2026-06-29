import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubGetCommitAction = createAction({
  auth: githubAuth,
  name: 'get_commit',
  displayName: 'Get Commit (Agent)',
  description: 'Fetches a single commit including its file changes.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single commit (GET /repos/{owner}/{repo}/commits/{ref}) by SHA, branch, or tag, including its files, stats, and parents. Resolve refs via List Commits or List Branches. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    ref: Property.ShortText({
      displayName: 'Ref',
      description: 'Commit SHA, branch name, or tag. Resolve via List Commits.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, ref } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/commits/${ref}`,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Commit "${ref}" in ${owner}/${repo}`);
    }
  },
});
