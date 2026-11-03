import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { TIER_QUERY } from '../../common/tier-props';
import { ghostTierOutputSchema } from '../../output-schemas';

export const ghostArchiveTier = createAction({
  auth: ghostAuth,
  name: 'ghost_archive_tier',
  outputSchema: ghostTierOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Tier',
  description: 'Archive a paid tier so new members can no longer buy it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archives a paid membership tier: it disappears from the pricing page and cannot be bought, while existing subscribers keep it. Staff can reactivate it in Ghost Admin. Archiving an archived tier is a no-op.',
    idempotent: true,
  },
  props: {
    tier_id: ghostProps.id('Tier ID', 'The tier ID, from List Tiers.'),
  },
  async run(context) {
    const id = ghostCommon.id(context.propsValue.tier_id, 'Tier ID');
    return ghostResource.edit(context.auth, 'tiers', id, { active: false }, TIER_QUERY);
  },
});
