import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubCreateReleaseAction = createAction({
  auth: githubAuth,
  name: 'create_release',
  displayName: 'Create Release (Agent)',
  description: 'Creates a release for a tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a release (POST /repos/{owner}/{repo}/releases) for a tag. If the tag does not exist it is created from target_commitish (a branch or SHA, defaults to the default branch). Set draft/prerelease as needed. Not idempotent: each call creates a new release (and 422s if a release for the tag already exists).',
    idempotent: false,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The git tag for this release (e.g. "v1.2.0").',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Release Name',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Release notes.',
      required: false,
    }),
    target_commitish: Property.ShortText({
      displayName: 'Target Commitish',
      description:
        'Branch or SHA the tag is created from if it does not exist.',
      required: false,
    }),
    draft: Property.Checkbox({
      displayName: 'Draft',
      required: false,
    }),
    prerelease: Property.Checkbox({
      displayName: 'Prerelease',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      owner,
      repo,
      tag_name,
      name,
      body,
      target_commitish,
      draft,
      prerelease,
    } = propsValue;
    const requestBody: Record<string, unknown> = { tag_name };
    if (name !== undefined) requestBody['name'] = name;
    if (body !== undefined) requestBody['body'] = body;
    if (target_commitish !== undefined)
      requestBody['target_commitish'] = target_commitish;
    if (draft !== undefined) requestBody['draft'] = draft;
    if (prerelease !== undefined) requestBody['prerelease'] = prerelease;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/repos/${owner}/${repo}/releases`,
        body: requestBody,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
