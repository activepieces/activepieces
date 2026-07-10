import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateOrgAction = createAction({
  name: 'update_org',
  displayName: 'Update Organization',
  description: 'Update your organization details',
  audience: 'both',
  aiMetadata: { description: 'Update the authenticated user\'s existing organization, setting its name to the provided value. Use to rename or edit an org that already exists, not to provision one (use create-org for that). Idempotent: applying the same name repeatedly leaves the org in the same state.', idempotent: true },
  auth: zooAuth,
  // category: 'Organizations',
  props: {
    name: Property.ShortText({
      displayName: 'Organization Name',
      required: true,
      description: 'The new name for your organization',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: 'https://api.zoo.dev/org',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: {
        name: propsValue.name,
      },
    });
    return response.body;
  },
});
