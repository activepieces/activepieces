import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListRepositoryLabelsAction = createAction({
  auth: githubAuth,
  name: 'list_repository_labels',
  displayName: 'List Repository Labels (Agent)',
  description: "Lists a repository's label vocabulary.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all labels defined in a repository (GET /repos/{owner}/{repo}/labels). Use to resolve valid label names for Add Labels to Issue, Set Issue Labels, and Remove Label from Issue. Returns all pages. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue;
    try {
      const items = await githubPaginatedApiCall<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/labels`,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
