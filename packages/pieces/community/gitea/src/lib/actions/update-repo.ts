import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { giteaAuth } from '../auth';
import { giteaApiCall, giteaCommon } from '../common';

export const updateRepoSync = createAction({
  auth: giteaAuth,
  name: 'update_repo',
  displayName: 'Update Repository',
  description: 'Update repository settings.',
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

    const body: Record<string, any> = {};
    if (name) body['name'] = name;
    if (description) body['description'] = description;
    if (website) body['website'] = website;
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
