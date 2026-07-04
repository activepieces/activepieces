import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { omnisendAuth } from '../auth';
import { omnisendRequest } from '../common/client';

export const getContactAction = createAction({
  auth: omnisendAuth,
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Retrieve a contact by their contact ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch a single Omnisend contact by its contact ID. Use when you already have the contact ID and need its full profile; to find a contact by email instead, use List Contacts with an email filter. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      required: true,
    }),
  },
  async run(context) {
    const { contactId } = context.propsValue;
    return omnisendRequest(
      HttpMethod.GET,
      `/contacts/${contactId}`,
      context.auth.secret_text,
    );
  },
});
