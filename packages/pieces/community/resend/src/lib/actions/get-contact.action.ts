import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { getContactOutputSchema } from '../output-schemas';

export const getContact = createAction({
  name: 'get_contact',
  classification: 'READ',
  auth: resendAuth,
  displayName: 'Get Contact',
  outputSchema: getContactOutputSchema,
  description: 'Retrieve a single contact by ID or email, across all audiences',
  audience: 'ai',
  aiMetadata: { description: "Looks up a single contact account-wide by Resend contact ID or email address, without needing to know which audience they belong to. Use this to check a contact's subscription status or custom properties before sending or updating. Read-only and idempotent.", idempotent: true },
  props: {
    contact_identifier: resendProps.contactIdentifier,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest({ auth: auth.secret_text, method: HttpMethod.GET, path: `/contacts/${encodeURIComponent(propsValue.contact_identifier)}` });
  },
});
