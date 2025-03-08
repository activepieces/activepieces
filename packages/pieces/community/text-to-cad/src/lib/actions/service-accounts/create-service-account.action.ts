import { createAction, Property } from '@activepieces/pieces-framework';
import { textToCadAuth } from '../../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createServiceAccountAction = createAction({
  name: 'create_service_account',
  displayName: 'Create Service Account',
  description: 'Create a new service account for your organization',
  auth: textToCadAuth,
  category: 'Service Accounts',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
      description: 'Name for the service account',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/org/service-accounts',
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
