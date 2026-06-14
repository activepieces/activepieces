import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';

export const listContacts = createAction({
  name: 'list_contacts',
  auth: resendAuth,
  displayName: 'List Contacts',
  description: 'Retrieve all contacts in an audience',
  audience: 'both',
  aiMetadata: { description: 'Retrieves all contacts in a specific Resend audience, including each contact\'s ID, email, name, and subscription status. Use this to discover contact IDs (e.g. to feed Update Contact or Delete Contact) or to inspect a mailing list; requires the audience ID. Read-only and idempotent.', idempotent: true },
  props: {
    audience_id: resendProps.audienceId,
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest<{
      data: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        created_at: string;
        unsubscribed: boolean;
      }[];
    }>({
      method: HttpMethod.GET,
      url: `https://api.resend.com/audiences/${propsValue.audience_id}/contacts`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return response.body.data;
  },
});
