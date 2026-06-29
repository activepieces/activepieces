import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubGetReleaseAction = createAction({
  auth: githubAuth,
  name: 'get_release',
  displayName: 'Get Release (Agent)',
  description: 'Fetches a single release by its id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single release by its numeric id (GET /repos/{owner}/{repo}/releases/{release_id}). Resolve the id via List Releases. For the latest published release use Get Latest Release. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    release_id: Property.Number({
      displayName: 'Release ID',
      description: 'The numeric release id. Resolve via List Releases.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, release_id } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/releases/${release_id}`,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Release ${release_id} in ${owner}/${repo}`);
    }
  },
});
