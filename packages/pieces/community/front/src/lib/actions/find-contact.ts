import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContact = createAction({
  auth: frontAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Look up a contact by their ID or handle (email, phone, etc.).',
  props: {
    contact_identifier: Property.ShortText({
      displayName: 'Contact ID or Handle',
      description:
        "The contact's unique ID (e.g., crd_123) or a resource alias (e.g., email:john.doe@example.com).",
      required: true,
    }),
  },
  async run(context) {
    const { contact_identifier } = context.propsValue;
    const token = context.auth;

    const encodedIdentifier = encodeURIComponent(contact_identifier);

    return await makeRequest(
      token,
      HttpMethod.GET,
      `/contacts/${encodedIdentifier}`
    );
  },
});
