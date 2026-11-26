import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiGetDealAction = createAction({
  auth: apolloAuth,
  name: 'ai_get_deal',
  classification: 'READ',
  displayName: 'Get Deal',
  description: 'Get one deal by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Apollo deal (opportunity) by deal ID with amount, currency, stage, close date, won/closed flags, owner, account and custom fields. Uses no credits.',
    idempotent: true,
  },
  props: {
    deal_id: aiProps.id({ displayName: 'Deal ID', description: 'Deal ID from List Deals or Create Deal (field id).' }),
  },
  outputSchema: apolloOutputSchemas.deal,
  async run({ propsValue, auth }) {
    const body = await apolloRequests.getDeal({ apiKey: apiKeyOf(auth), dealId: apolloInputs.requireText({ value: propsValue.deal_id, label: 'Deal ID' }) });
    return { deal: apolloMappers.deal(body['opportunity']) };
  },
});
