import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { freshserviceApiCall } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiGetChange = createAction({
  auth: freshserviceAuth,
  name: 'ai_get_change',
  displayName: 'Get Change (AI)',
  description: 'Retrieves a Freshservice change request by ID.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: freshserviceSchemas.change,
  aiMetadata: {
    description:
      'Fetches one Freshservice change request by numeric change id, including status, risk, type, planned dates and assignment. Use List Changes to find an id. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    change_id: Property.Number({ displayName: 'Change ID', required: true }),
  },
  async run(context) {
    const response = await freshserviceApiCall<{ change: Record<string, unknown> }>({
      method: HttpMethod.GET,
      endpoint: `changes/${context.propsValue.change_id}`,
      auth: context.auth,
    });
    return response.body.change;
  },
});
