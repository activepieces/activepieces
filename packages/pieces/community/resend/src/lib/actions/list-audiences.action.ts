import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { listAudiencesOutputSchema } from '../output-schemas';

export const listAudiences = createAction({
  name: 'list_audiences',
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Audiences',
  outputSchema: listAudiencesOutputSchema,
  description: 'Retrieve all contact audiences in your Resend account',
  audience: 'both',
  aiMetadata: { description: 'Retrieves all contact audiences (mailing lists) in the connected Resend account, including each audience\'s ID and name. Use this to discover an audience ID needed by contact and broadcast actions (e.g. Create Contact, List Contacts, Create Broadcast). Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await resendClient.sendRequest<{
      data: { id: string; name: string; created_at: string }[];
    }>({ auth: auth.secret_text, method: HttpMethod.GET, path: '/audiences' });
    return response.data;
  },
});
