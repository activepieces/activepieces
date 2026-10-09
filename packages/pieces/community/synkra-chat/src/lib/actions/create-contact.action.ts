import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

export const createContactAction = createAction({
  auth: synkraChatAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact in Synkra Chat.',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'E.164 format, for example +27123456789.',
      required: false,
    }),
    identifier: Property.ShortText({
      displayName: 'External ID',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { name: propsValue.name };
    if (propsValue.email) body.email = propsValue.email;
    if (propsValue.phone_number) body.phone_number = propsValue.phone_number;
    if (propsValue.identifier) body.identifier = propsValue.identifier;

    return synkraChatRequest({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/contacts',
      body,
    });
  },
});
