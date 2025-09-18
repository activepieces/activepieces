import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContact = createAction({
  auth: frontAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: "Look up a contact by their handle (e.g., email, phone number).",
  props: {
    source: Property.StaticDropdown({
        displayName: 'Source',
        description: 'The type of handle to search by.',
        required: true,
        options: {
            options: [
              { label: 'Email', value: 'email' },
              { label: 'Phone', value: 'phone' },
              { label: 'Twitter', value: 'twitter' },
              { label: 'Facebook', value: 'facebook' },
              { label: 'Intercom', value: 'intercom' },
              { label: 'Front Chat', value: 'front_chat' },
              { label: 'Custom', value: 'custom' },
            ],
        },
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: "The handle to search for (e.g., 'john.doe@example.com', '+15551234567').",
      required: true,
    }),
  },
  async run(context) {
    const { source, handle } = context.propsValue;
    const token = context.auth;

    const contactAlias = `alt:${source}:${handle}`;

    return await makeRequest(
        token,
        HttpMethod.GET,
        `/contacts/${contactAlias}`
    );
  },
});