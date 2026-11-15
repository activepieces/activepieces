import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../auth';
import { smartleadOperations } from '../common/operations';
import { smartleadOutputSchemas } from '../common/output-schemas';

export const createCampaignAction = createAction({
  auth: smartleadAuth,
  name: 'create_campaign',
  classification: 'WRITE',
  displayName: 'Create Campaign',
  description: 'Create a new cold email campaign in SmartLead',
  audience: 'human',
  outputSchema: smartleadOutputSchemas.createCampaign,
  props: {
    name: Property.ShortText({
      displayName: 'Campaign Name',
      description: 'Name of the new campaign.',
      required: true,
    }),
    client_id: Property.Number({
      displayName: 'Client ID',
      description:
        'Associate the campaign with a specific client (for agency/white-label accounts). Leave empty to use your default.',
      required: false,
    }),
  },
  async run(context) {
    return smartleadOperations.createCampaign({
      apiKey: context.auth.secret_text,
      name: context.propsValue.name,
      clientId: context.propsValue.client_id,
    });
  },
});
