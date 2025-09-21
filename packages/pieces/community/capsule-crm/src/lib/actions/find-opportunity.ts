import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';

export const findOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_opportunity',
  displayName: 'Find Opportunity',
  description: 'Find opportunities by search criteria',
  
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Opportunity name or description to search for',
      required: true,
    }),
  },

  async run(context) {
    const { searchTerm } = context.propsValue;

    const endpoint = `/opportunities?q=${encodeURIComponent(searchTerm)}`;

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      endpoint
    );

    return {
      opportunities: response.opportunities || [],
      total: response.opportunities?.length || 0,
    };
  },
});
