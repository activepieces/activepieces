import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreateBranchAiAction = createAction({
  auth: githubAuth,
  name: 'create_branch_ai',
  displayName: 'Create Branch (Agent)',
  description: 'Creates a new branch from the tip of a source branch.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new branch pointing at the tip of a source branch. It first reads the source branch tip (GET /repos/{owner}/{repo}/branches/{source}) then creates the ref (POST /repos/{owner}/{repo}/git/refs with ref=refs/heads/<new_branch_name>). Resolve branch names via List Branches. Not idempotent: a second call with the same branch name fails because the ref already exists.',
    idempotent: false,
  },
  props: {
    owner: Property.ShortText({
      displayName: 'Owner',
      description:
        'Repository owner login (user or org). Resolve via List My Repositories or Search Repositories.',
      required: true,
    }),
    repo: Property.ShortText({
      displayName: 'Repository',
      description: 'Repository name (without the owner prefix).',
      required: true,
    }),
    source_branch: Property.ShortText({
      displayName: 'Source Branch',
      description:
        'The branch whose tip the new branch starts from (e.g. "main"). Resolve via List Branches.',
      required: true,
    }),
    new_branch_name: Property.ShortText({
      displayName: 'New Branch Name',
      description: "The name for the new branch (e.g. 'feature/new-design').",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, source_branch, new_branch_name } = propsValue;
    try {
      const sourceBranchInfo = await githubApiCall<{ commit: { sha: string } }>(
        {
          auth,
          method: HttpMethod.GET,
          resourceUri: `/repos/${owner}/${repo}/branches/${source_branch}`,
        }
      );
      const sourceSha = sourceBranchInfo.body.commit.sha;

      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/repos/${owner}/${repo}/git/refs`,
        body: {
          ref: `refs/heads/${new_branch_name}`,
          sha: sourceSha,
        },
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404)
        throw new Error(
          `Source branch "${source_branch}" or repository ${owner}/${repo} not found.`
        );
      if (status === 422)
        throw new Error(
          `Branch "${new_branch_name}" already exists (or the ref is invalid).`
        );
      if (status === 403)
        throw new Error('Permission denied creating the branch.');
      throw error;
    }
  },
});
