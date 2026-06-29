import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubGetLatestReleaseAction = createAction({
  auth: githubAuth,
  name: 'get_latest_release',
  displayName: 'Get Latest Release (Agent)',
  description: 'Fetches the latest published release.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches the latest published release (GET /repos/{owner}/{repo}/releases/latest) — the most recent non-draft, non-prerelease release by date. Returns 404 if the repo has no published release. Read-only and idempotent.',
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
        resourceUri: `/repos/${owner}/${repo}/releases/latest`,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Latest release in ${owner}/${repo}`);
    }
  },
});
