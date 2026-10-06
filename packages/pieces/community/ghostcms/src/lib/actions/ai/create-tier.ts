import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostResource } from '../../common/resources';
import { tierBody } from '../../common/tier-body';
import { TIER_QUERY, tierProps } from '../../common/tier-props';
import { ghostTierOutputSchema } from '../../output-schemas';

export const ghostCreateTier = createAction({
  auth: ghostAuth,
  name: 'ghost_create_tier',
  outputSchema: ghostTierOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Tier',
  description: 'Create a paid membership tier.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a paid membership tier with prices in the smallest currency unit; a public tier appears on the site pricing page right away, so confirm pricing before calling. Selling it needs Stripe connected in Ghost. Each call creates a new tier.',
    idempotent: false,
  },
  props: tierProps('create'),
  async run(context) {
    const body = tierBody(context.propsValue);
    if ((body['monthly_price'] !== undefined || body['yearly_price'] !== undefined) && !body['currency']) {
      throw new Error('Currency is required when setting a price.');
    }
    return ghostResource.create(context.auth, 'tiers', body, TIER_QUERY);
  },
});
