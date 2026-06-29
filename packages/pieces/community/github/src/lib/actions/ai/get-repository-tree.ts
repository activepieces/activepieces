import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall, RequestParams } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubGetRepositoryTreeAction = createAction({
  auth: githubAuth,
  name: 'get_repository_tree',
  displayName: 'Get Repository Tree (Agent)',
  description: 'Lists the full file tree at a given ref.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the git tree at a tree SHA or branch name (GET /repos/{owner}/{repo}/git/trees/{tree_sha}). Set recursive=true for the full nested file inventory. Complements Get File Content (single path/dir). The tree_sha can be a branch name like "main". Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    tree_sha: Property.ShortText({
      displayName: 'Tree SHA or Branch',
      description: 'A tree SHA or branch name (e.g. "main").',
      required: true,
    }),
    recursive: Property.Checkbox({
      displayName: 'Recursive',
      description: 'Return the full nested tree instead of just the top level.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, tree_sha, recursive } = propsValue;
    const query: RequestParams = {};
    if (recursive) query['recursive'] = '1';
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/git/trees/${tree_sha}`,
        query,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Tree "${tree_sha}" in ${owner}/${repo}`);
    }
  },
});
