import { createAction, Property, HttpMethod } from '@activepieces/pieces-framework';
import { systemeioAuth } from '../../';
import { SystemeioApiClient } from '../auth';

export const systemeioCreateContact = createAction({
  auth: systemeioAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact with email, name, and optional tags',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the contact',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'List of tags to assign (e.g., ["VIP", "Webinar Attendee"])',
      required: false,
    }),
  },
  async run(context) {
    const { email, name, tags } = context.propsValue;
    const client = new SystemeioApiClient(context.auth as string);
    return await client.request({
      method: HttpMethod.POST,
      path: '/contacts',
      contentType: 'application/json',
      body: {
        email,
        name,
        tags: tags || [],
      },
    });
  },
}); 