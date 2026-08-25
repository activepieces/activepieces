import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { organizationIdDropdown } from '../common/props';
import { videoaskAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const createContact = createAction({
  auth: videoaskAuth,
  name: 'createContact',
  displayName: 'create contact',
  description: 'Create a new respondent (contact)',
  audience: 'both',
  aiMetadata: { description: 'Create a new VideoAsk contact (respondent) in an organization; email is required, name and phone optional. Use when you need to register a respondent record. Not idempotent: each call creates a separate contact, with no dedup on email.', idempotent: false },
  props: {
    organizationId: organizationIdDropdown,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the contact',
      required: true,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number of the contact',
      required: false,
    }),
  },
  async run(context) {
    const { organizationId, name, email, phone_number } = context.propsValue;
    const access_token = context.auth.access_token;

    const body = {
      name,
      email,
      phone_number,
    };

    const response = await makeRequest(
      organizationId as string,
      access_token,
      HttpMethod.POST,
      '/contacts',
      body
    );

    return response;
  },
});
