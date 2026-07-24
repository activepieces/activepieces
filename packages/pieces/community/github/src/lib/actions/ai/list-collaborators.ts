import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListCollaboratorsAction = createAction({
  auth: githubAuth,
  name: 'list_collaborators',
  displayName: 'List Collaborators (Agent)',
  description: 'Lists the collaborators on a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the collaborators on a repository (GET /repos/{owner}/{repo}/collaborators) with each one's permission level. Use to resolve logins for Request Pull Request Reviewers or Remove Collaborator. Returns all pages. Read-only and idempotent.",
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
        resourceUri: `/repos/${owner}/${repo}/collaborators`,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
