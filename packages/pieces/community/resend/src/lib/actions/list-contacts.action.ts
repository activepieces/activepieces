import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { listContactsOutputSchema } from '../output-schemas';

export const listContacts = createAction({
  name: 'list_contacts',
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Contacts',
  outputSchema: listContactsOutputSchema,
  description: 'Retrieve all contacts in an audience',
  audience: 'both',
  aiMetadata: { description: 'Retrieves all contacts in a specific Resend audience, including each contact\'s ID, email, name, and subscription status. Use this to discover contact IDs (e.g. to feed Update Contact or Delete Contact) or to inspect a mailing list; requires the audience ID. Read-only and idempotent.', idempotent: true },
  props: {
    audience_id: resendProps.audienceId,
  },
  async run({ auth, propsValue }) {
    const response = await resendClient.sendRequest<{
      data: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        created_at: string;
        unsubscribed: boolean;
      }[];
    }>({ auth: auth.secret_text, method: HttpMethod.GET, path: `/audiences/${propsValue.audience_id}/contacts` });
    return response.data;
  },
});
