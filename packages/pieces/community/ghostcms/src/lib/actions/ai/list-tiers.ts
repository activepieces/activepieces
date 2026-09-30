import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { TIER_QUERY } from '../../common/tier-props';
import { ghostListTiersOutputSchema } from '../../output-schemas';

export const ghostListTiers = createAction({
  auth: ghostAuth,
  name: 'ghost_list_tiers',
  outputSchema: ghostListTiersOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Tiers',
  description: 'List membership tiers with prices and benefits.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists membership tiers (the free tier and paid tiers) with prices, benefits and active state. Filter type:paid+active:true for sellable paid tiers. The tier ID is what Create Offer needs.',
    idempotent: true,
  },
  props: {
    filter: ghostProps.filter('type:paid+active:true'),
    limit: ghostProps.limit,
    page: ghostProps.page,
    order: ghostProps.order('monthly_price asc'),
  },
  async run(context) {
    return ghostResource.list(context.auth, 'tiers', {
      ...ghostCommon.listQuery(context.propsValue),
      ...TIER_QUERY,
    });
  },
});
