import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubUpdateLabelAction = createAction({
  auth: githubAuth,
  name: 'update_label',
  displayName: 'Update Label (Agent)',
  description: 'Renames or recolors an existing repository label.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing repository label by its current name (PATCH /repos/{owner}/{repo}/labels/{name}) — set a new name, color, or description. Resolve label names via List Repository Labels. Idempotent: applying the same values again leaves the label in the same state.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    name: Property.ShortText({
      displayName: 'Current Name',
      description:
        'The current label name to update. Resolve via List Repository Labels.',
      required: true,
    }),
    new_name: Property.ShortText({
      displayName: 'New Name',
      description: 'New label name (leave empty to keep the current name).',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description:
        'Six-character hex color code without the leading "#" (e.g. "f29513").',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, name, new_name, color, description } = propsValue;
    const body: Record<string, unknown> = {};
    if (new_name !== undefined) body['new_name'] = new_name;
    if (color !== undefined) body['color'] = color;
    if (description !== undefined) body['description'] = description;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.PATCH,
        resourceUri: `/repos/${owner}/${repo}/labels/${encodeURIComponent(
          name
        )}`,
        body,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Label "${name}" in ${owner}/${repo}`);
    }
  },
});
