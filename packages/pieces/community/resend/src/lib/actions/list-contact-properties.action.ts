import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { listContactPropertiesOutputSchema } from '../output-schemas';

export const listContactProperties = createAction({
  name: 'list_contact_properties',
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Contact Properties',
  outputSchema: listContactPropertiesOutputSchema,
  description: 'Retrieve all custom contact fields defined on the account',
  audience: 'ai',
  aiMetadata: { description: 'Retrieves every custom contact property defined on the account, including each one\'s key, type, and fallback value. Use this to discover a property ID (e.g. for Update or Delete Contact Property) or to check what custom fields exist before creating a new one. Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await resendClient.sendRequest<{
      data: { id: string; key: string; type: string; fallback_value?: string; created_at: string }[];
    }>({ auth: auth.secret_text, method: HttpMethod.GET, path: '/contact-properties' });
    return response.data;
  },
});
