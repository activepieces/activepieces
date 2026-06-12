import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartleadRequest } from '../common/client';
import { smartleadAuth } from '../auth';

export const createCampaignAction = createAction({
  auth: smartleadAuth,
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Create a new cold email campaign in SmartLead',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new, empty cold email campaign in SmartLead, identified by name; on agency/white-label accounts an optional client ID associates it with a specific client. Use this as the first step before adding leads or configuring sequences. Not idempotent: each call creates a separate campaign even with the same name.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Campaign Name',
      description:
        'Name of the campaign. Defaults to "Untitled Campaign" if not provided.',
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
    const { name, client_id } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const body: Record<string, unknown> = { name };
    if (client_id !== undefined && client_id !== null) {
      body['client_id'] = client_id;
    }

    return await smartleadRequest({
      endpoint: 'campaigns/create',
      method: HttpMethod.POST,
      apiKey,
      body,
    });
  },
});
