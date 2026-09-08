import { createAction } from '@activepieces/pieces-framework';
import { listCrmTagsOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';

export const listCrmTagsAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_list_crm_tags',
  classification: 'SEARCH',
  displayName: 'List CRM Tags',
  description: 'List every unique tag currently used across CRM contacts.',
  audience: 'both',
  aiMetadata: { description: 'Lists every unique tag currently in use across WhatsScale CRM contacts. Use to see the existing tag taxonomy before adding a new tag, so you can reuse an existing one instead of creating a near-duplicate. Read-only and idempotent.', idempotent: true },
  outputSchema: listCrmTagsOutputSchema,
  props: {},
  async run(context) {
    const auth = context.auth.secret_text;

    const response = await whatsscaleClient(auth, HttpMethod.GET, '/api/crm/tags');
    return response.body;
  },
});
