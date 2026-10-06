import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { applyClearFields, clearFieldsProp } from '../../common/clear-fields';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { tierBody } from '../../common/tier-body';
import { TIER_QUERY, tierProps } from '../../common/tier-props';
import { ghostTierOutputSchema } from '../../output-schemas';

export const ghostUpdateTier = createAction({
  auth: ghostAuth,
  name: 'ghost_update_tier',
  outputSchema: ghostTierOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Tier',
  description: 'Update the prices, benefits or settings of a tier.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits a membership tier by ID; only the inputs you supply change, Benefits replaces the full list (an empty list removes every benefit), and Clear Fields blanks the description or welcome page URL. New prices apply to new subscribers only and change the public pricing page. Use Archive Tier to stop selling it.',
    idempotent: true,
  },
  props: {
    tier_id: ghostProps.id('Tier ID', 'The tier ID, from List Tiers.'),
    ...tierProps('update'),
    clear_fields: clearFieldsProp([
      { label: 'Description', value: 'description' },
      { label: 'Welcome Page URL', value: 'welcome_page_url' },
    ]),
  },
  async run(context) {
    const id = ghostCommon.id(context.propsValue.tier_id, 'Tier ID');
    const body = applyClearFields({
      body: tierBody(context.propsValue),
      clear: context.propsValue.clear_fields,
      allowed: ['description', 'welcome_page_url'],
      clearValue: null,
    });
    return ghostResource.edit(context.auth, 'tiers', id, body, TIER_QUERY);
  },
});
