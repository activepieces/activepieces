import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOrgAction = createAction({
  name: 'get_org',
  displayName: 'Get Organization',
  description: 'Retrieve details of your organization',
  audience: 'both',
  aiMetadata: { description: 'Retrieve details of the organization tied to the authenticated account (name, settings, billing context). Takes no input and reads the single org for the current credentials. Read-only with no side effects.', idempotent: true },
  auth: zooAuth,
  // category: 'Organizations',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/org',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
