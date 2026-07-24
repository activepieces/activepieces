import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubGetReferenceAction = createAction({
  auth: githubAuth,
  name: 'get_reference',
  displayName: 'Get Reference (Agent)',
  description: 'Resolves a git ref to its commit SHA.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Resolves a git reference (GET /repos/{owner}/{repo}/git/ref/{ref}) such as "heads/main" or "tags/v1.0.0" to its object SHA. Use to obtain a commit sha for creating a branch. The ref must NOT include the leading "refs/". Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    ref: Property.ShortText({
      displayName: 'Ref',
      description: 'The ref without the "refs/" prefix, e.g. "heads/main".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, ref } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/git/ref/${ref}`,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Ref "${ref}" in ${owner}/${repo}`);
    }
  },
});
