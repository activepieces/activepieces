import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

export const createContactAction = createAction({
  auth: trustAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Creates a new contact in the system.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new contact in the Trust workspace, optionally with name, email, phone, and a profile image URL. Pick this to register a person before requesting or attaching testimonials; to modify someone who already exists, use Update Contact instead. All fields are optional, and every call creates a new contact record, so repeated calls produce duplicates (not idempotent).',
    idempotent: false,
  },
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
