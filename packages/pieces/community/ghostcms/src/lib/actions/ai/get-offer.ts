import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostOfferOutputSchema } from '../../output-schemas';

export const ghostGetOffer = createAction({
  auth: ghostAuth,
  name: 'ghost_get_offer',
  outputSchema: ghostOfferOutputSchema,
  classification: 'READ',
  displayName: 'Get Offer',
  description: 'Get an offer by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one offer by ID with its code, discount type and amount, duration, cadence, tier and redemption count.',
    idempotent: true,
  },
  props: {
    offer_id: ghostProps.id('Offer ID', 'The offer ID, from List Offers.'),
  },
  async run(context) {
    return ghostResource.get(context.auth, 'offers', ghostCommon.id(context.propsValue.offer_id, 'Offer ID'));
  },
});
