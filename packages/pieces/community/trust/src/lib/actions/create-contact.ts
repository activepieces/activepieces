import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

export const createContactAction = createAction({
  auth: trustAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Creates a new contact in the system.',
  props: {
    firstname: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastname: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    imageUrl: Property.ShortText({
      displayName: 'Profile Image URL',
      description: 'URL of the contact profile image.',
      required: false,
    }),
  },
  async run(context) {
    const { props } = context.auth;
    const p = context.propsValue;

    const body: Record<string, unknown> = {
      workspaceId: props.workspace_id,
    };

    if (p.firstname) body['firstname'] = p.firstname;
    if (p.lastname) body['lastname'] = p.lastname;
    if (p.email) body['email'] = p.email;
    if (p.phone) body['phone'] = p.phone;
    if (p.imageUrl) body['imageUrl'] = p.imageUrl;

    const response = await trustApiRequest({
      apiKey: props.api_key,
      method: HttpMethod.POST,
      path: '/contacts',
      body,
    });
    return response.body;
  },
});
