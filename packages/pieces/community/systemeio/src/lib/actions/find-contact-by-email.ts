import { createAction, Property } from '@activepieces/pieces-framework';
import { SystemeioApiClient } from '../api-client';
import { systemeioAuth } from '../auth';

export const findContactByEmail = createAction({
  auth: systemeioAuth,
  name: 'find_contact_by_email',
  displayName: 'Find Contact by Email',
  description: 'Locate an existing contact by email address.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      description: 'The email address to search for.'
    })
  },
  async run({ auth, propsValue }) {
    const client = new SystemeioApiClient(auth);
    const response = await client.findContactByEmail(propsValue.email);
    return response;
  },
}); 