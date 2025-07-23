import { createAction, Property, HttpMethod } from '@activepieces/pieces-framework';
import { systemeioAuth } from '../../';
import { SystemeioApiClient } from '../auth';

export const systemeioFindContactByEmail = createAction({
  auth: systemeioAuth,
  name: 'find_contact_by_email',
  displayName: 'Find Contact by Email',
  description: 'Locate an existing contact by email address',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to search for',
      required: true,
    }),
  },
  async run(context) {
    const { email } = context.propsValue;
    const client = new SystemeioApiClient(context.auth as string);
    const result = await client.request({
      method: HttpMethod.GET,
      path: '/contacts',
      queryParams: { email, limit: '100', order: 'desc' },
    });
    return result.items;
  },
}); 