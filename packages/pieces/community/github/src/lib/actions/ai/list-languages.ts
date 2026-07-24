import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListLanguagesAction = createAction({
  auth: githubAuth,
  name: 'list_languages',
  displayName: 'List Languages (Agent)',
  description: 'Returns the language byte-count map for a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the languages detected in a repository (GET /repos/{owner}/{repo}/languages) as a map of language name to byte count. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/languages`,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
