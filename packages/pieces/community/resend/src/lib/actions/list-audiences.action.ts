import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const listAudiences = createAction({
  name: 'list_audiences',
  auth: resendAuth,
  displayName: 'List Audiences',
  description: 'Retrieve all contact audiences in your Resend account',
  audience: 'both',
  aiMetadata: { description: 'Retrieves all contact audiences (mailing lists) in the connected Resend account, including each audience\'s ID and name. Use this to discover an audience ID needed by contact and broadcast actions (e.g. Create Contact, List Contacts, Create Broadcast). Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest<{
      data: { id: string; name: string; created_at: string }[];
    }>({
      method: HttpMethod.GET,
      url: 'https://api.resend.com/audiences',
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return response.body.data;
  },
});
