import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiCreateCampaignAction = createAction({
  auth: smartleadAuth,
  name: 'ai_create_campaign',
  classification: 'WRITE',
  displayName: 'Create Campaign',
  description: 'Create a new, empty SmartLead campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new, empty (drafted) SmartLead cold email campaign with the given name and returns its numeric id. On agency accounts pass client_id to assign it to a client. Not idempotent: each call creates another campaign even with the same name, so check List Campaigns first. Next steps: Add Leads to Campaign, Update Campaign Settings, Update Campaign Status.',
    idempotent: false,
  },
  outputSchema: smartleadOutputSchemas.createCampaign,
  props: {
    name: Property.ShortText({ displayName: 'Campaign Name', required: true }),
    client_id: Property.Number({ displayName: 'Client ID', description: 'Agency client id. Omit for your own account.', required: false }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.createCampaign({ apiKey: auth.secret_text, name: propsValue.name, clientId: propsValue.client_id });
  },
});
