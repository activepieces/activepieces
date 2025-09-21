import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';

export const findOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_opportunity',
  displayName: 'Find Opportunity',
  description: 'Find an opportunity by its name or other criteria.',
  props: {
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description: 'The text to search for in the opportunity name.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const opportunities = await capsuleCrmClient.findOpportunity(auth, {
      searchTerm: propsValue.search_term,
    });

    return opportunities;
  },
});
