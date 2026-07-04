import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createServiceAccountAction = createAction({
  name: 'create_service_account',
  displayName: 'Create Service Account',
  description: 'Create a new service account for your organization',
  audience: 'both',
  aiMetadata: { description: 'Create a new organization service account with the given name and return its credentials. Use to provision programmatic access for the org. Not idempotent: each call creates a distinct service account even if the name repeats.', idempotent: false },
  auth: zooAuth,
  // category: 'Service Accounts',
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
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: {
        name: propsValue.name,
      },
    });
    return response.body;
  },
});
