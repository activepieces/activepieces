import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

export const updateContactAction = createAction({
  auth: synkraChatAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update fields on an existing contact.',
  props: {
    contact_id: Property.Number({ displayName: 'Contact ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone_number: Property.ShortText({ displayName: 'Phone Number', required: false }),
    identifier: Property.ShortText({ displayName: 'External ID', required: false }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.name) body.name = propsValue.name;
    if (propsValue.email) body.email = propsValue.email;
    if (propsValue.phone_number) body.phone_number = propsValue.phone_number;
    if (propsValue.identifier) body.identifier = propsValue.identifier;

    return synkraChatRequest({
      auth: auth.props,
      method: HttpMethod.PUT,
      path: `/contacts/${propsValue.contact_id}`,
      body,
    });
  },
});
