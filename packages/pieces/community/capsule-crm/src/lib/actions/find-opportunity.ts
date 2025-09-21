import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { capsuleCrmProps } from '../common/props';

export const findOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_opportunity',
  displayName: 'Find Opportunity',
  description: 'Find an opportunity by its name or other criteria.',
  props: {
    opportunity_id: capsuleCrmProps.opportunity_id(false),
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description:
        'The text to search for in the opportunity name. (Used if Opportunity ID is not selected).',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { opportunity_id, search_term } = propsValue;
    if (opportunity_id) {
      const opportunity = await capsuleCrmClient.getOpportunity(
        auth,
        opportunity_id as number
      );
      return opportunity ? [opportunity] : [];
    }
    if (search_term) {
      const opportunities = await capsuleCrmClient.findOpportunity(auth, {
        searchTerm: search_term,
      });
      return opportunities;
    }
    throw new Error('One of Opportunity ID or Search Term must be provided.');
  },
});
