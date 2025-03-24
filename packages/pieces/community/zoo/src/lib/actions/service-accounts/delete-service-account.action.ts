import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteServiceAccountAction = createAction({
  name: 'delete_service_account',
  displayName: 'Delete Service Account',
  description: 'Delete a service account from your organization',
  auth: zooAuth,
  // category: 'Service Accounts',
  props: {
    token: Property.ShortText({
      displayName: 'Token',
      required: true,
      description: 'Token of the service account to delete',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.zoo.dev/org/service-accounts/${propsValue.token}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
