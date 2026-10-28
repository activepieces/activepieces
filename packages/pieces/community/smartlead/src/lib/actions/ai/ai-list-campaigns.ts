import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiListCampaignsAction = createAction({
  auth: smartleadAuth,
  name: 'ai_list_campaigns',
  classification: 'SEARCH',
  displayName: 'List Campaigns',
  description: 'List all SmartLead campaigns.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every SmartLead campaign in the account with id, name, status (DRAFTED, ACTIVE, PAUSED, STOPPED, COMPLETED), created_at, updated_at and client_id. Use it to find the numeric campaign_id other tools need. Optional client_id filters to one agency client. Read-only.',
    idempotent: true,
  },
  outputSchema: smartleadOutputSchemas.listCampaigns,
  props: {
    client_id: Property.Number({ displayName: 'Client ID', description: 'Only campaigns of this agency client.', required: false }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.listCampaigns({ apiKey: auth.secret_text, clientId: propsValue.client_id });
  },
});
