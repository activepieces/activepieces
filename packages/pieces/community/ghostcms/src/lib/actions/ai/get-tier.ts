import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { TIER_QUERY } from '../../common/tier-props';
import { ghostTierOutputSchema } from '../../output-schemas';

export const ghostGetTier = createAction({
  auth: ghostAuth,
  name: 'ghost_get_tier',
  outputSchema: ghostTierOutputSchema,
  classification: 'READ',
  displayName: 'Get Tier',
  description: 'Get a membership tier by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one membership tier by ID with its prices, currency, benefits, visibility and active state.',
    idempotent: true,
  },
  props: {
    tier_id: ghostProps.id('Tier ID', 'The tier ID, from List Tiers.'),
  },
  async run(context) {
    return ghostResource.get(context.auth, 'tiers', ghostCommon.id(context.propsValue.tier_id, 'Tier ID'), TIER_QUERY);
  },
});
