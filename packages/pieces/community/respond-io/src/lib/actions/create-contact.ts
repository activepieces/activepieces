import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../../';
import { BASE_URL, commonProps } from '../common';

export const createContact = createAction({
  auth: respondIoAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a new contact in Respond.io',
  props: {
    email: commonProps.email,
    phone: commonProps.phone,
    name: commonProps.name,
    tags: commonProps.tags,
  },
  async run(context) {
    const { email, phone, name, tags } = context.propsValue;
    const { apiKey, workspaceId } = context.auth;

    if (!email && !phone) {
      throw new Error('Either email or phone is required');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/workspaces/${workspaceId}/contacts`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        email,
        phone,
        name,
        tags,
      },
    });

    return response.body;
  },
}); 