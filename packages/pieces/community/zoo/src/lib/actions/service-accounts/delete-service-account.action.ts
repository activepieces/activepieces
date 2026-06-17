import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteServiceAccountAction = createAction({
  name: 'delete_service_account',
  displayName: 'Delete Service Account',
  description: 'Delete a service account from your organization',
  audience: 'both',
  aiMetadata: { description: 'Permanently remove the organization service account identified by its token. Use to revoke a service account; destructive. Not strictly idempotent: a first call deletes it and a repeat may error if the token no longer exists.', idempotent: false },
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
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
