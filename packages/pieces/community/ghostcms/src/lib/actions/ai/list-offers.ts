import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostResource } from '../../common/resources';
import { ghostListOffersOutputSchema } from '../../output-schemas';

export const ghostListOffers = createAction({
  auth: ghostAuth,
  name: 'ghost_list_offers',
  outputSchema: ghostListOffersOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Offers',
  description: 'List discount and trial offers.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all discount and free-trial offers with their code, discount, duration, tier and status in one call; Ghost does not paginate offers. Filter status:active to hide archived ones.',
    idempotent: true,
  },
  props: {
    filter: ghostProps.filter('status:active'),
  },
  async run(context) {
    return ghostResource.list(context.auth, 'offers', { filter: context.propsValue.filter?.trim() }, false);
  },
});
