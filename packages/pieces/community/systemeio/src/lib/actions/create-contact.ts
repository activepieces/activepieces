import { createAction, Property } from '@activepieces/pieces-framework';
import { SystemeioApiClient } from '../api-client';
import { systemeioAuth } from '../auth';

export const createContact = createAction({
  auth: systemeioAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact in systeme.io',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Optional tags to assign to the contact',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new SystemeioApiClient(auth);
    const data: any = {
      email: propsValue.email,
    };
    if (propsValue.name) data.name = propsValue.name;
    if (propsValue.tags) data.tags = propsValue.tags;
    const response = await client.postContact(data);
    return response;
  },
}); 