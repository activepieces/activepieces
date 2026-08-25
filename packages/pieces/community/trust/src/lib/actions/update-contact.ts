import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

export const updateContactAction = createAction({
  auth: trustAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Updates an existing contact in the system.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update an existing Trust contact identified by its contact ID; both the ID and the email are required by the API, while name, phone, and profile image URL are optional. Pick this to modify a known contact rather than Create Contact, which would add a duplicate. It overwrites via PUT with the supplied fields, so repeating the same call yields the same state (idempotent).',
    idempotent: true,
  },
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to update.',
      required: true,
    }),
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
      description: 'Required by the Trust API to identify the contact.',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    imageUrl: Property.ShortText({
      displayName: 'Profile Image URL',
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
    body['email'] = p.email;
    if (p.phone) body['phone'] = p.phone;
    if (p.imageUrl) body['imageUrl'] = p.imageUrl;

    const response = await trustApiRequest({
      apiKey: props.api_key,
      method: HttpMethod.PUT,
      path: `/contacts/${p.contactId}`,
      body,
    });
    return response.body;
  },
});
