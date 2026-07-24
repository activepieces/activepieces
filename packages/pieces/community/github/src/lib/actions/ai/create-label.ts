import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubCreateLabelAction = createAction({
  auth: githubAuth,
  name: 'create_label',
  displayName: 'Create Label (Agent)',
  description: 'Defines a new label in a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new label in a repository (POST /repos/{owner}/{repo}/labels) with a name, hex color, and optional description. To change an existing label use Update Label. Not idempotent: a second call with the same name returns 422 (already exists).',
    idempotent: false,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The label name.',
      required: true,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description:
        'Six-character hex color code without the leading "#" (e.g. "f29513").',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Short description of the label.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, name, color, description } = propsValue;
    const body: Record<string, unknown> = { name };
    if (color !== undefined) body['color'] = color;
    if (description !== undefined) body['description'] = description;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/repos/${owner}/${repo}/labels`,
        body,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Label "${name}" in ${owner}/${repo}`);
    }
  },
});
