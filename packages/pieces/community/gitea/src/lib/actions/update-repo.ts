import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { giteaAuth } from '../auth';
import { giteaApiCall } from '../common/client';
import { giteaCommon } from '../common/props';

export const updateRepoSync = createAction({
  auth: giteaAuth,
  name: 'update_repo',
  displayName: 'Update Repository',
  description: 'Update repository settings.',
  audience: 'both',
  aiMetadata: { description: 'Updates settings on an existing Gitea repository such as its name, description, website, or private/public visibility; only the fields you supply are changed. Use to rename a repo or adjust its metadata. Repeating the call with the same values leaves the repository in the same state, so it is idempotent.', idempotent: true },
  props: {
    repository: giteaCommon.repositoryDropdown,
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
      description: 'The name of the repository.',
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    private: Property.Checkbox({
      displayName: 'Private',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
  },
  async run(context) {
    const { repo, owner } = context.propsValue.repository!;
    const { name, description, website } = context.propsValue;
    const isPrivate = context.propsValue.private;

    const body: Record<string, unknown> = {};
    if (name !== undefined && name !== null) body['name'] = name;
    if (description !== undefined && description !== null) body['description'] = description;
    if (website !== undefined && website !== null) body['website'] = website;
    if (isPrivate !== undefined) body['private'] = isPrivate;

    const response = await giteaApiCall({
      auth: context.auth,
      method: HttpMethod.PATCH,
      resourceUri: `/repos/${owner}/${repo}`,
      body: body,
    });

    return response.body;
  },
});
