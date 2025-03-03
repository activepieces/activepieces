import { createAction, Property } from '@activepieces/pieces-framework';
import { textToCadAuth } from '../../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateOrgAction = createAction({
  name: 'update_org',
  displayName: 'Update Organization',
  description: 'Update your organization details',
  auth: textToCadAuth,
  category: 'Organizations',
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
        Authorization: `Bearer ${auth}`,
      },
      body: {
        name: propsValue.name,
      },
    });
    return response.body;
  },
});
