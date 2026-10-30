import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostOfferOutputSchema } from '../../output-schemas';

export const ghostArchiveOffer = createAction({
  auth: ghostAuth,
  name: 'ghost_archive_offer',
  outputSchema: ghostOfferOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Offer',
  description: 'Archive an offer so it can no longer be redeemed.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archives an offer: its link and code stop working for new redemptions, while members who already redeemed it keep their discount. Staff can reactivate it in Ghost Admin. Archiving an archived offer is a no-op.',
    idempotent: true,
  },
  props: {
    offer_id: ghostProps.id('Offer ID', 'The offer ID, from List Offers.'),
  },
  async run(context) {
    const id = ghostCommon.id(context.propsValue.offer_id, 'Offer ID');
    return ghostResource.edit(context.auth, 'offers', id, { status: 'archived' });
  },
});
