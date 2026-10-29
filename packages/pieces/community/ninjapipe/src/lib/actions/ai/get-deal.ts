import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiGetDeal = createAction({
  auth: ninjapipeAuth,
  name: 'ai_get_deal',
  classification: 'READ',
  displayName: 'Get Deal',
  description: 'Gets one deal by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch one NinjaPipe deal by deal_id: name, value, status, owner, linked contact and company, custom fields. Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.deal,
  props: {
    deal_id: ninjapipeAiProps.id({ displayName: 'Deal ID', description: 'NinjaPipe deal UUID, from ai_search_deals or ai_search_companies.' }),
  },
  async run(context) {
    return ninjapipeClient.getRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/deals/${ninjapipeClient.pathId({ value: context.propsValue.deal_id, field: 'Deal ID' })}`,
      operation: 'get deal',
    });
  },
});
